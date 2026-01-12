# Neon Connection Patterns

Deep dive into Neon Serverless PostgreSQL connection management.

## Understanding Neon Endpoints

Neon provides two types of endpoints:

### Pooled Endpoint (Recommended for Apps)

- URL pattern: `ep-xxx-pooler.region.aws.neon.tech`
- Uses PgBouncer for connection pooling
- Supports up to 10,000 concurrent connections
- Best for application queries

### Direct Endpoint (For Migrations)

- URL pattern: `ep-xxx.region.aws.neon.tech`
- Direct connection to PostgreSQL
- Limited concurrent connections (based on compute size)
- Required for: migrations, schema changes, `SET` commands

## Connection String Formats

### For SQLModel/SQLAlchemy (asyncpg)

```bash
# Pooled (application queries)
DATABASE_URL="postgresql+asyncpg://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct (migrations)
DATABASE_URL_DIRECT="postgresql+asyncpg://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### For psycopg2 (sync, migrations)

```bash
DATABASE_URL_SYNC="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### For Alembic

```python
# alembic/env.py
from src.config import settings

# Use direct connection for migrations
config.set_main_option("sqlalchemy.url", settings.database_url_direct)
```

## Engine Configuration

### Serverless-Optimized Engine

```python
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

# For serverless (Neon handles pooling)
engine = create_async_engine(
    settings.database_url,
    poolclass=NullPool,  # Disable SQLAlchemy pooling
    connect_args={
        "ssl": "require",
        "server_settings": {
            "application_name": "todo-api",  # Helps identify connections
        },
    },
)
```

### Traditional Server Engine

```python
# For traditional servers (if not using Neon pooler)
engine = create_async_engine(
    settings.database_url_direct,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,  # Verify connections before use
    connect_args={"ssl": "require"},
)
```

## Connection Lifecycle

### Request-Scoped Sessions

```python
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a database session for the duration of a request.

    - Creates new connection from pool
    - Yields session for request handling
    - Commits on success, rolls back on error
    - Returns connection to pool
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Long-Running Operations

```python
@asynccontextmanager
async def get_dedicated_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get a session with explicit transaction control.
    Use for long-running operations or when you need
    multiple commits within a single logical operation.
    """
    async with async_session_maker() as session:
        yield session
        # Manual commit/rollback required
```

## Cold Start Handling

Neon computes can scale to zero. Handle cold starts gracefully:

```python
import asyncio
from sqlalchemy.exc import OperationalError

async def execute_with_retry(
    session: AsyncSession,
    statement,
    max_retries: int = 3,
    initial_delay: float = 0.5,
):
    """Execute with exponential backoff for cold starts."""
    delay = initial_delay
    last_error = None

    for attempt in range(max_retries):
        try:
            result = await session.exec(statement)
            return result
        except OperationalError as e:
            last_error = e
            if "connection" in str(e).lower():
                await asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                raise

    raise last_error
```

## Connection Health Monitoring

```python
from datetime import datetime

@router.get("/health/db")
async def check_database(session: AsyncSession = Depends(get_session)):
    """Health check endpoint for database connectivity."""
    try:
        start = datetime.utcnow()
        await session.exec(text("SELECT 1"))
        latency_ms = (datetime.utcnow() - start).total_seconds() * 1000

        return {
            "status": "healthy",
            "latency_ms": round(latency_ms, 2),
            "endpoint": "pooled" if "pooler" in settings.database_url else "direct",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }
```

## SSL/TLS Configuration

Neon requires SSL. Ensure proper configuration:

```python
# Option 1: Connection string parameter
url = "postgresql+asyncpg://...?sslmode=require"

# Option 2: Connect args
engine = create_async_engine(
    url,
    connect_args={
        "ssl": "require",  # or "verify-full" for stricter validation
    },
)

# Option 3: SSL context (most secure)
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED

engine = create_async_engine(
    url,
    connect_args={"ssl": ssl_context},
)
```

## Environment-Specific Configuration

```python
# src/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str

    @property
    def effective_database_url(self) -> str:
        """Return appropriate database URL based on environment."""
        if self.environment == "test":
            return "sqlite+aiosqlite:///:memory:"
        return self.database_url

    @property
    def engine_kwargs(self) -> dict:
        """Return engine configuration based on environment."""
        if self.environment == "test":
            return {
                "connect_args": {"check_same_thread": False},
                "poolclass": StaticPool,
            }
        return {
            "poolclass": NullPool,
            "connect_args": {"ssl": "require"},
        }
```

## Troubleshooting

### Connection Refused

```
Error: connection refused to host
```

**Solutions:**
1. Check IP allowlist in Neon dashboard
2. Verify endpoint URL (pooler vs direct)
3. Check if compute is suspended (will auto-wake)

### SSL Required

```
Error: SSL connection is required
```

**Solution:** Add `?sslmode=require` to connection string or set `ssl` in connect_args.

### Too Many Connections

```
Error: too many connections
```

**Solutions:**
1. Use pooler endpoint instead of direct
2. Enable `NullPool` in SQLAlchemy (let Neon handle pooling)
3. Check for connection leaks (sessions not being closed)

### Connection Timeout

```
Error: connection timed out
```

**Solutions:**
1. Implement retry with backoff (cold start)
2. Increase connection timeout
3. Check Neon compute status in dashboard
