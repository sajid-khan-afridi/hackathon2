"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import create_db_and_tables
from .routes import health, tasks
from .schemas import ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    create_db_and_tables()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="RESTful API for the Todo Full-Stack Web Application",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with standardized format."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=str(exc.detail),
            status_code=exc.status_code,
            request_id=str(uuid4()),
            code=exc.headers.get("X-Error-Code") if exc.headers else None,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            detail="Internal server error",
            status_code=500,
            request_id=str(uuid4()),
            code="INTERNAL_ERROR",
        ).model_dump(),
    )


# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Todo API",
        "docs": "/docs",
        "health": "/health",
    }
