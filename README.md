# Risumd

Personal career-management and tailored-resume application.

## Repository Structure

* `backend/` — FastAPI, SQLAlchemy 2.x, Pydantic v2, PostgreSQL (psycopg) Career Vault service.
* `frontend/` — (Coming in Phase 2) Next.js user interface.

## Quick Start (Backend)

1. Ensure PostgreSQL is running and create databases:
   ```sql
   CREATE DATABASE risumd;
   CREATE DATABASE risumd_test;
   ```

2. Configure environment:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

3. Setup & start:
   ```bash
   uv sync
   uv run alembic upgrade head
   uv run python scripts/seed.py
   uv run uvicorn app.main:app --reload
   ```

4. Run test suite:
   ```bash
   uv run pytest -v
   ```

For full backend details, see [backend/README.md](file:///d:/coding/web%20dev/WD-PROJECTS/Risumd/backend/README.md).
