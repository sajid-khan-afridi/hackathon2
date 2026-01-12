# Quickstart: Todo Full-Stack Web Application

**Feature**: 002-todo-fullstack-webapp
**Date**: 2025-12-29

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.13+ | [python.org](https://python.org) |
| UV | Latest | `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Required Accounts

| Service | Purpose | Signup |
|---------|---------|--------|
| Neon | PostgreSQL Database | [neon.tech](https://neon.tech) (free tier) |
| Vercel | Frontend Hosting | [vercel.com](https://vercel.com) (free tier) |
| Railway or Render | Backend Hosting | [railway.app](https://railway.app) or [render.com](https://render.com) |

---

## Project Setup

### 1. Clone and Navigate

```bash
cd /mnt/d/GitHub\ Connected/hackathon2
git checkout 002-todo-fullstack-webapp
```

### 2. Create Project Structure

```bash
mkdir -p phase2/{backend/src/routes,backend/tests,frontend/src/{app,components,lib,types},frontend/tests}
```

### 3. Initialize Backend (Python/FastAPI)

```bash
cd phase2/backend

# Create pyproject.toml
cat > pyproject.toml << 'EOF'
[project]
name = "todo-backend"
version = "0.1.0"
description = "FastAPI backend for Todo Full-Stack Web Application"
readme = "README.md"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlmodel>=0.0.22",
    "psycopg2-binary>=2.9.9",
    "pyjwt>=2.9.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "black>=24.0.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"

[tool.ruff]
line-length = 100

[tool.black]
line-length = 100
EOF

# Install dependencies
uv sync
```

### 4. Initialize Frontend (Next.js)

```bash
cd ../frontend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "todo-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
EOF

# Install dependencies
npm install
```

---

## Environment Configuration

### Backend (.env)

Create `phase2/backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)

Create `phase2/frontend/.env.local`:

```bash
# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API (private - not exposed to browser)
BACKEND_URL=http://localhost:8000
```

---

## Database Setup

### 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 2. Run Migrations

```bash
cd phase2/backend

# Create initial migration
cat > migrations/001_create_tasks.sql << 'EOF'
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
EOF

# Run migration (using psql or your preferred tool)
psql $DATABASE_URL -f migrations/001_create_tasks.sql
```

---

## Running Locally

### Start Backend

```bash
cd phase2/backend
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Start Frontend

```bash
cd phase2/frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## Running Tests

### Backend Tests

```bash
cd phase2/backend
uv run pytest --cov=src --cov-report=term-missing
```

### Frontend Tests

```bash
cd phase2/frontend
npm test
```

---

## Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Deploy Backend to Railway

1. Connect GitHub repository
2. Configure environment variables
3. Set start command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
4. Deploy

---

## Verification Checklist

- [ ] Backend health check: `curl http://localhost:8000/health`
- [ ] Frontend loads at http://localhost:3000
- [ ] User can sign up and sign in
- [ ] User can create a task
- [ ] User can view task list
- [ ] User can mark task complete
- [ ] User can edit task
- [ ] User can delete task
- [ ] Tasks persist after browser refresh
- [ ] User A cannot see User B's tasks

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### JWT Token Issues

```bash
# Verify token structure
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq
```

### CORS Issues

Ensure `ALLOWED_ORIGINS` in backend matches frontend URL exactly.

### Port Conflicts

```bash
# Check if port is in use
lsof -i :8000
lsof -i :3000
```

---

## Next Steps

After completing local setup:

1. Run `/sp.tasks` to generate implementation tasks
2. Follow TDD cycle: Red (write failing test) -> Green (implement) -> Refactor
3. Create PHR records for each significant session
4. Deploy to staging after each milestone
