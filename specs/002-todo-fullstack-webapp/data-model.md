# Data Model: Todo Full-Stack Web Application

**Feature**: 002-todo-fullstack-webapp
**Date**: 2025-12-29
**Status**: Complete

## Entity Overview

| Entity | Description | Owner | Storage |
|--------|-------------|-------|---------|
| User | Registered account with credentials | Better Auth | `users` table |
| Session | Authentication session | Better Auth | `sessions` table |
| Account | OAuth/credential account link | Better Auth | `accounts` table |
| Task | To-do item belonging to a user | Application | `tasks` table |

---

## Entity: User (Better Auth Managed)

Better Auth manages user records automatically. The application reads user data but does not write to this table directly.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `VARCHAR(255)` | PRIMARY KEY | Unique user identifier (UUID) |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | User's email address |
| `name` | `VARCHAR(255)` | NOT NULL | Display name |
| `emailVerified` | `BOOLEAN` | DEFAULT false | Email verification status |
| `image` | `TEXT` | NULLABLE | Profile image URL |
| `createdAt` | `TIMESTAMP` | DEFAULT NOW() | Account creation time |
| `updatedAt` | `TIMESTAMP` | DEFAULT NOW() | Last update time |

### Relationships

- **One-to-Many**: User has many Tasks
- **One-to-Many**: User has many Sessions (managed by Better Auth)

---

## Entity: Task (Application Managed)

Core application entity representing a to-do item.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `SERIAL` | PRIMARY KEY | Auto-incrementing task ID |
| `user_id` | `VARCHAR(255)` | FOREIGN KEY, NOT NULL, INDEX | Owner user reference |
| `title` | `VARCHAR(200)` | NOT NULL | Task title (1-200 chars) |
| `description` | `TEXT` | NULLABLE | Task description (max 2000 chars) |
| `completed` | `BOOLEAN` | DEFAULT false, INDEX | Completion status |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Creation timestamp (UTC) |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW() | Last update timestamp (UTC) |

### Relationships

- **Many-to-One**: Task belongs to one User

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_tasks_user_id` | `user_id` | Filter tasks by user (data isolation) |
| `idx_tasks_completed` | `completed` | Filter by completion status |
| `idx_tasks_user_completed` | `user_id, completed` | Combined filter for user + status |

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | Required, non-empty after trim | "Title is required" |
| `title` | Max 200 characters | "Title must be 200 characters or less" |
| `description` | Max 2000 characters | "Description must be 2000 characters or less" |
| `user_id` | Must match authenticated user | "Forbidden" |

### State Transitions

```
┌─────────────┐     toggle()     ┌─────────────┐
│  PENDING    │ ───────────────► │  COMPLETED  │
│ completed=  │                  │ completed=  │
│   false     │ ◄─────────────── │   true      │
└─────────────┘     toggle()     └─────────────┘
```

---

## SQLModel Implementation

### Task Model (Python)

```python
# backend/src/models.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class TaskBase(SQLModel):
    """Base task fields shared between create/update/response."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)

class Task(TaskBase, table=True):
    """Database table model for tasks."""
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, foreign_key="user.id")
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(TaskBase):
    """Request schema for creating a task."""
    pass

class TaskUpdate(SQLModel):
    """Request schema for updating a task (all fields optional)."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)

class TaskPublic(TaskBase):
    """Response schema for task data."""
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime
```

---

## TypeScript Interfaces (Frontend)

```typescript
// frontend/src/types/index.ts

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;  // ISO 8601 datetime
  updatedAt: string;  // ISO 8601 datetime
}

export interface TaskCreate {
  title: string;
  description?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  detail: string;
  status_code: number;
  request_id: string;
  code?: string;
}

export interface TaskListResponse extends ApiResponse<Task[]> {}
export interface TaskResponse extends ApiResponse<Task> {}
```

---

## Database Migration

### Initial Migration (PostgreSQL)

```sql
-- migrations/001_create_tasks.sql

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);

-- Add foreign key constraint (after Better Auth creates users table)
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user
--     FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Data Access Patterns

### Query Patterns

| Operation | Query Pattern | Index Used |
|-----------|---------------|------------|
| List user tasks | `WHERE user_id = ?` | `idx_tasks_user_id` |
| List completed | `WHERE user_id = ? AND completed = true` | `idx_tasks_user_completed` |
| List pending | `WHERE user_id = ? AND completed = false` | `idx_tasks_user_completed` |
| Get single task | `WHERE id = ? AND user_id = ?` | PRIMARY KEY + user check |

### Example Queries (SQLModel)

```python
from sqlmodel import select

# List all tasks for user
statement = select(Task).where(Task.user_id == user_id)
tasks = session.exec(statement).all()

# List pending tasks
statement = select(Task).where(
    Task.user_id == user_id,
    Task.completed == False
)

# List completed tasks
statement = select(Task).where(
    Task.user_id == user_id,
    Task.completed == True
)

# Get task with ownership check
task = session.get(Task, task_id)
if task and task.user_id == user_id:
    return task
```

---

## Data Validation Summary

### Create Task
- `title`: Required, 1-200 chars, trimmed, non-empty
- `description`: Optional, max 2000 chars

### Update Task
- `title`: Optional, if provided: 1-200 chars, trimmed, non-empty
- `description`: Optional, if provided: max 2000 chars

### Toggle Complete
- No request body
- Toggles `completed` field
- Updates `updated_at` timestamp

### Delete Task
- Requires task ownership verification
- Hard delete (no soft delete in Phase II)

---

## Entity-Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐
│      USER        │         │      TASK        │
│  (Better Auth)   │         │  (Application)   │
├──────────────────┤         ├──────────────────┤
│ id          PK   │◄───────┤│ user_id     FK   │
│ email       UQ   │    1:N  │ id          PK   │
│ name             │         │ title            │
│ emailVerified    │         │ description      │
│ image            │         │ completed        │
│ createdAt        │         │ created_at       │
│ updatedAt        │         │ updated_at       │
└──────────────────┘         └──────────────────┘
```

---

## Notes

1. **Better Auth Tables**: Better Auth automatically creates and manages `user`, `session`, `account`, and `verification` tables. Do not modify these directly.

2. **User ID Format**: Better Auth generates UUIDs for user IDs. The `user_id` in tasks is a string to match this format.

3. **Timestamps**: All timestamps stored in UTC. Frontend converts to user's local timezone for display.

4. **Cascade Delete**: When a user is deleted, their tasks should be cascade deleted. This is handled by the foreign key constraint.

5. **No Soft Delete**: Phase II uses hard delete for simplicity. Soft delete can be added in later phases if needed.
