# Database Migrations

Migration strategies for Neon PostgreSQL with Alembic.

## Setup

### Install Dependencies

```bash
uv add alembic asyncpg
```

### Initialize Alembic

```bash
cd backend
alembic init alembic
```

### Configure alembic.ini

```ini
# alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .

# Use async driver
sqlalchemy.url = driver://user:pass@localhost/dbname
```

### Configure env.py for Async

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlmodel import SQLModel

from alembic import context

# Import all models to register them with SQLModel.metadata
from src.models import Task  # noqa: F401

# this is the Alembic Config object
config = context.config

# Load logging configuration
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata
target_metadata = SQLModel.metadata


def get_url() -> str:
    """Get database URL from environment."""
    from src.config import settings
    # Use DIRECT connection for migrations (not pooler)
    return settings.database_url_direct or settings.database_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## Creating Migrations

### Auto-Generate from Models

```bash
# Create migration from model changes
alembic revision --autogenerate -m "add tasks table"
```

### Manual Migration

```bash
# Create empty migration
alembic revision -m "add custom index"
```

### Example Migration File

```python
# alembic/versions/001_create_tasks_table.py
"""create tasks table

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tasks table."""
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("completed", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("idx_tasks_user_id", "tasks", ["user_id"])
    op.create_index("idx_tasks_completed", "tasks", ["completed"])
    op.create_index("idx_tasks_user_completed", "tasks", ["user_id", "completed"])


def downgrade() -> None:
    """Drop tasks table."""
    op.drop_index("idx_tasks_user_completed", table_name="tasks")
    op.drop_index("idx_tasks_completed", table_name="tasks")
    op.drop_index("idx_tasks_user_id", table_name="tasks")
    op.drop_table("tasks")
```

## Running Migrations

### Apply All Migrations

```bash
alembic upgrade head
```

### Apply Specific Migration

```bash
alembic upgrade 001
```

### Rollback One Migration

```bash
alembic downgrade -1
```

### Rollback All

```bash
alembic downgrade base
```

### Check Current Version

```bash
alembic current
```

### Show History

```bash
alembic history
```

## Migration Patterns

### Adding Columns

```python
def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("priority", sa.Integer(), default=0, nullable=False),
    )


def downgrade() -> None:
    op.drop_column("tasks", "priority")
```

### Adding Indexes

```python
def upgrade() -> None:
    op.create_index(
        "idx_tasks_priority",
        "tasks",
        ["priority"],
    )


def downgrade() -> None:
    op.drop_index("idx_tasks_priority", table_name="tasks")
```

### Renaming Columns

```python
def upgrade() -> None:
    op.alter_column(
        "tasks",
        "title",
        new_column_name="name",
    )


def downgrade() -> None:
    op.alter_column(
        "tasks",
        "name",
        new_column_name="title",
    )
```

### Data Migrations

```python
from sqlalchemy import text


def upgrade() -> None:
    # Add new column
    op.add_column(
        "tasks",
        sa.Column("status", sa.String(20), nullable=True),
    )

    # Migrate data
    connection = op.get_bind()
    connection.execute(
        text("""
            UPDATE tasks
            SET status = CASE
                WHEN completed = true THEN 'completed'
                ELSE 'pending'
            END
        """)
    )

    # Make column required
    op.alter_column("tasks", "status", nullable=False)


def downgrade() -> None:
    op.drop_column("tasks", "status")
```

## Neon-Specific Considerations

### Use Direct Endpoint

Always use the direct endpoint (not pooler) for migrations:

```python
# alembic/env.py
def get_url() -> str:
    from src.config import settings
    # CRITICAL: Use direct connection for DDL operations
    return settings.database_url_direct
```

### Branch-Based Development

Neon supports database branches for development:

```bash
# Create branch for migration testing
neon branches create --name migration-test

# Get branch connection string
neon connection-string --branch migration-test

# Test migration on branch
DATABASE_URL_DIRECT="..." alembic upgrade head

# If successful, merge or apply to main
```

### Zero-Downtime Migrations

For production, use safe migration patterns:

```python
# Instead of altering column type directly
# Step 1: Add new column
def upgrade_step1() -> None:
    op.add_column("tasks", sa.Column("title_new", sa.String(300)))


# Step 2: Migrate data (can be done gradually)
def upgrade_step2() -> None:
    connection = op.get_bind()
    connection.execute(text("UPDATE tasks SET title_new = title"))


# Step 3: Drop old column (after app is updated)
def upgrade_step3() -> None:
    op.drop_column("tasks", "title")
    op.alter_column("tasks", "title_new", new_column_name="title")
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/migrate.yml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'backend/alembic/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: |
          pip install uv
          cd backend && uv sync

      - name: Run migrations
        env:
          DATABASE_URL_DIRECT: ${{ secrets.DATABASE_URL_DIRECT }}
        run: |
          cd backend
          uv run alembic upgrade head
```

### Pre-Deployment Check

```bash
#!/bin/bash
# scripts/check-migrations.sh

# Check for pending migrations
CURRENT=$(alembic current 2>/dev/null | grep -oP '\w+(?= \(head\))')
HEAD=$(alembic heads 2>/dev/null | grep -oP '^\w+')

if [ "$CURRENT" != "$HEAD" ]; then
    echo "Pending migrations detected!"
    echo "Current: $CURRENT"
    echo "Head: $HEAD"
    exit 1
fi

echo "Database is up to date"
```

## Troubleshooting

### Migration Conflicts

```bash
# When multiple developers create migrations from same base
alembic merge -m "merge heads" head1 head2
```

### Failed Migration Recovery

```bash
# Check alembic_version table
SELECT * FROM alembic_version;

# Manually fix if needed
UPDATE alembic_version SET version_num = 'correct_version';
```

### Offline SQL Generation

```bash
# Generate SQL without executing (for review or manual application)
alembic upgrade head --sql > migration.sql
```
