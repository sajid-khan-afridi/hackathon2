# Phase II: Todo Full-Stack Web Application

A modern full-stack todo application with user authentication, task management, and responsive design.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15+, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.13+, SQLModel |
| Database | Neon Serverless PostgreSQL |
| Authentication | Better Auth with JWT tokens |

## Project Structure

```
phase2/
├── backend/
│   ├── src/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings and configuration
│   │   ├── db.py             # Database connection
│   │   ├── models.py         # SQLModel database models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT verification middleware
│   │   └── routes/           # API route handlers
│   ├── tests/                # Backend tests
│   ├── migrations/           # Database migrations
│   └── pyproject.toml        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and API client
│   │   └── types/            # TypeScript interfaces
│   ├── tests/                # Frontend tests
│   └── package.json          # Node.js dependencies
│
└── docker-compose.yml        # Local development
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.13+
- UV package manager (`pip install uv`)
- Neon PostgreSQL account (free tier)

### Backend Setup

```bash
cd phase2/backend

# Copy environment variables
cp .env.example .env
# Edit .env with your Neon DATABASE_URL and BETTER_AUTH_SECRET

# Install dependencies
uv sync

# Run development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### Frontend Setup

```bash
cd phase2/frontend

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Testing

### Backend Tests

```bash
cd phase2/backend
uv run pytest --cov=src --cov-report=term-missing
```

Target: 80% code coverage

### Frontend Tests

```bash
cd phase2/frontend
npm test -- --coverage
```

Target: 60% code coverage

## Features

- **User Authentication**: Sign up, sign in, sign out with secure JWT tokens
- **Task Management**: Create, read, update, delete tasks
- **Task Completion**: Toggle task completion status
- **Responsive Design**: Works on desktop and mobile devices
- **User Data Isolation**: Each user only sees their own tasks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/{user_id}/tasks | List user's tasks |
| POST | /api/{user_id}/tasks | Create a task |
| GET | /api/{user_id}/tasks/{id} | Get a task |
| PUT | /api/{user_id}/tasks/{id} | Update a task |
| DELETE | /api/{user_id}/tasks/{id} | Delete a task |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle completion |

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Neon PostgreSQL connection string |
| BETTER_AUTH_SECRET | JWT signing secret (min 32 chars) |
| ALLOWED_ORIGINS | CORS allowed origins |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_APP_URL | Public app URL |
| BETTER_AUTH_SECRET | JWT signing secret (same as backend) |
| DATABASE_URL | Database for Better Auth tables |
| BACKEND_URL | FastAPI backend URL (private) |

## Development

See [CLAUDE.md](./CLAUDE.md) for agent-specific instructions and development guidelines.
