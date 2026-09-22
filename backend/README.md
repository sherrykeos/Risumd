# Risumd — Backend (Phase 1 & 2: Career Vault & Job / JD Analysis)

Backend foundation for **Risumd**, a personal career-management and tailored-resume application.

Risumd is built local-first. The user maintains a structured Career Vault containing reusable career information (projects, skills, technologies, experience, education, achievements) alongside target Jobs and structured JD Analyses. In future phases, job descriptions will be matched against this vault to generate tailored LaTeX resumes.

---

## 1. Architecture Overview

Risumd Backend follows a clean modular monolith architecture with strict separation between API routing, validation schemas, business services, and database persistence models:

```text
backend/
├── app/
│   ├── main.py                  # FastAPI entry point, CORS, and exception handlers
│   ├── api/                     # Thin REST controllers
│   │   ├── router.py            # Master API router
│   │   ├── projects.py          # Project endpoints
│   │   ├── skills.py            # Skill endpoints
│   │   ├── technologies.py      # Technology endpoints
│   │   ├── experience.py        # Work experience endpoints
│   │   ├── education.py         # Education endpoints
│   │   ├── achievements.py      # Achievement endpoints
│   │   ├── jobs.py              # Job endpoints
│   │   └── jd_analysis.py       # JD Analysis endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic Settings & environment configuration
│   │   └── exceptions.py        # Domain exceptions & HTTP error response handlers
│   ├── db/
│   │   └── database.py          # SQLAlchemy 2.0 Engine & SessionLocal dependency
│   ├── models/                  # SQLAlchemy 2.0 Declarative Models
│   │   ├── base.py              # Base class & timestamp mixins
│   │   ├── associations.py      # Normalized M2M association tables
│   │   ├── project.py           # Project entity
│   │   ├── skill.py             # Skill entity
│   │   ├── technology.py        # Technology entity
│   │   ├── experience.py        # Experience entity
│   │   ├── education.py         # Education entity
│   │   ├── achievement.py       # Achievement entity
│   │   ├── job.py               # Job entity
│   │   └── jd_analysis.py       # JD Analysis entity (PostgreSQL JSONB fields)
│   ├── schemas/                 # Pydantic v2 validation & response schemas
│   │   ├── project.py
│   │   ├── skill.py
│   │   ├── technology.py
│   │   ├── experience.py
│   │   ├── education.py
│   │   ├── achievement.py
│   │   ├── job.py
│   │   └── jd_analysis.py
│   └── services/                # Business logic & relational resolution
│       ├── project_service.py
│       ├── skill_service.py
│       ├── technology_service.py
│       ├── experience_service.py
│       ├── education_service.py
│       ├── achievement_service.py
│       ├── job_service.py
│       └── jd_analysis_service.py
├── alembic/                     # Database migrations
│   ├── env.py
│   └── versions/
│       ├── 001_initial_career_vault.py
│       └── 002_job_and_jd_analysis.py
├── scripts/
│   └── seed.py                  # Development database seed script
├── tests/                       # Pytest test suite (74 unit/integration tests)
│   ├── conftest.py              # Isolated PostgreSQL (risumd_test) fixtures
│   ├── test_health.py
│   ├── test_projects.py
│   ├── test_skills.py
│   ├── test_technologies.py
│   ├── test_experience.py
│   ├── test_education.py
│   ├── test_achievements.py
│   ├── test_relationships.py
│   ├── test_jobs.py
│   └── test_jd_analysis.py
├── alembic.ini                  # Alembic configuration
├── pyproject.toml               # Project dependencies & packaging
├── .gitignore
├── .env.example                 # Environment variable templates
└── README.md
```

### Relational Data Model

#### Career Vault
Relationships between career items are fully normalized using explicit association tables:

```text
Project
   ├── project_skills (M2M) ─────────── Skill
   ├── project_technologies (M2M) ───── Technology
   └── project_achievements (M2M) ───── Achievement

Experience
   ├── experience_skills (M2M) ──────── Skill
   ├── experience_technologies (M2M) ── Technology
   └── experience_achievements (M2M) ── Achievement
```

- Deleting a Project or Experience cascades through association rows, but **preserves** the underlying Skills, Technologies, and Achievements.
- Foreign key constraints and cascades are enforced natively in PostgreSQL.

#### Job & JD Analysis
Jobs have a 1-to-1 relationship with JDAnalysis:

```text
Job (1) <─────── (1) JDAnalysis [job_id UNIQUE, ondelete=CASCADE]
                       ├── required_skills (JSONB array)
                       ├── preferred_skills (JSONB array)
                       ├── technologies (JSONB array)
                       ├── responsibilities (JSONB array)
                       └── keywords (JSONB array)
```

- Deleting a Job automatically cascades and removes its associated JDAnalysis.
- Deleting a JDAnalysis preserves the parent Job.
- A Job can have at most one JDAnalysis (enforced by a database unique constraint).

---

## 2. Prerequisites

* **Python**: 3.12+ (tested with Python 3.12, 3.13, and 3.14)
* **uv**: Fast Python package manager ([installation instructions](https://github.com/astral-sh/uv))
* **PostgreSQL**: Version 14+ must be installed and running locally or accessible via network.

---

## 3. Database Setup

1. Connect to your PostgreSQL server and create the development and testing databases:
   ```sql
   CREATE DATABASE risumd;
   CREATE DATABASE risumd_test;
   ```

2. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Set your PostgreSQL connection string in `backend/.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd
   TEST_DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd_test
   ```
   *(Adjust user, password, host, and port as needed for your PostgreSQL installation).*

---

## 4. Installation

Synchronize dependencies with `uv`:

```bash
cd backend
uv sync
```

---

## 5. Database Migrations

Apply Alembic migrations to create the database schema in PostgreSQL:

```bash
uv run alembic upgrade head
```

To roll back a migration:

```bash
uv run alembic downgrade -1
```

---

## 6. Development Seed Data

Populate the database with sample fictional projects, skills, technologies, work experience, and sample jobs:

```bash
uv run python scripts/seed.py
```

*Note: The seed script is idempotent and will cleanly skip execution if sample data already exists.*

---

## 7. Starting the Server

Run the development server with hot-reloading:

```bash
uv run uvicorn app.main:app --reload
```

The server will be available at `http://127.0.0.1:8000`.

---

## 8. Running Tests

The test suite runs against the dedicated PostgreSQL test database `risumd_test`. Tests never modify the development database.

Run pytest:

```bash
uv run pytest -v
```

Coverage encompasses (74 passing tests):
- Complete CRUD across all 6 Career Vault entities
- Complete CRUD for Jobs and 1-to-1 JD Analyses
- PostgreSQL JSONB array persistence and queries
- Validation checks (empty fields, invalid URLs, `end_date < start_date`)
- Duplicate unique constraints (409 Conflict)
- Missing entity lookups (404 Not Found)
- Relational integrity and reusability across projects and experiences
- Cascade behaviors (deleting a job cascades to its analysis, deleting an analysis preserves the job)

---

## 9. API Documentation

Interactive documentation is automatically generated by FastAPI:

* **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **OpenAPI JSON**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

### Available Endpoints

#### System
* `GET /health` — Service health check

#### Projects (`/api/projects`)
* `GET /api/projects` — List all projects
* `GET /api/projects/{id}` — Retrieve a project by ID with resolved technologies, skills, and achievements
* `POST /api/projects` — Create a project (supports nested technology names, skill names, and achievements)
* `PATCH /api/projects/{id}` — Update a project
* `DELETE /api/projects/{id}` — Delete a project

#### Skills (`/api/skills`)
* `GET /api/skills` — List all skills (supports `?category=...` filtering)
* `GET /api/skills/{id}` — Retrieve a skill by ID
* `POST /api/skills` — Create a unique skill
* `PATCH /api/skills/{id}` — Update a skill
* `DELETE /api/skills/{id}` — Delete a skill

#### Technologies (`/api/technologies`)
* `GET /api/technologies` — List all technologies
* `GET /api/technologies/{id}` — Retrieve a technology by ID
* `POST /api/technologies` — Create a unique technology
* `PATCH /api/technologies/{id}` — Update a technology
* `DELETE /api/technologies/{id}` — Delete a technology

#### Experience (`/api/experience`)
* `GET /api/experience` — List all work experiences
* `GET /api/experience/{id}` — Retrieve an experience by ID
* `POST /api/experience` — Create an experience (supports nested associations)
* `PATCH /api/experience/{id}` — Update an experience
* `DELETE /api/experience/{id}` — Delete an experience

#### Education (`/api/education`)
* `GET /api/education` — List all education records
* `GET /api/education/{id}` — Retrieve an education record by ID
* `POST /api/education` — Create an education record
* `PATCH /api/education/{id}` — Update an education record
* `DELETE /api/education/{id}` — Delete an education record

#### Achievements (`/api/achievements`)
* `GET /api/achievements` — List all achievements
* `GET /api/achievements/{id}` — Retrieve an achievement by ID
* `POST /api/achievements` — Create an achievement
* `PATCH /api/achievements/{id}` — Update an achievement
* `DELETE /api/achievements/{id}` — Delete an achievement

#### Jobs (`/api/jobs`)
* `GET /api/jobs` — List all jobs as direct `list[JobResponse]` (includes nested `analysis` if present)
* `GET /api/jobs/{id}` — Retrieve a job by ID (includes nested `analysis` if present)
* `POST /api/jobs` — Create a new job listing
* `PATCH /api/jobs/{id}` — Update job fields
* `DELETE /api/jobs/{id}` — Delete a job (cascades to its analysis)

#### JD Analysis (`/api/jobs/{id}/analysis`)
* `GET /api/jobs/{id}/analysis` — Retrieve structured JD analysis for a job
* `POST /api/jobs/{id}/analysis` — Create structured JD analysis for a job (enforces 1-to-1 uniqueness)
* `PATCH /api/jobs/{id}/analysis` — Update JD analysis fields (seniority, domain, skills, technologies, responsibilities, keywords, summary)
* `DELETE /api/jobs/{id}/analysis` — Delete JD analysis (preserves the parent job)

