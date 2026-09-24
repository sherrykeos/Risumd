# Risumd — Backend Complete MVP (Career Vault, Job Analysis, Matching, Resume Versioning, LaTeX/PDF & Application Tracking)

Backend foundation for **Risumd**, a personal career-management and tailored-resume application.

Risumd is built local-first around a single canonical source of truth: the **Career Vault**. The vault holds reusable career evidence (projects, skills, technologies, experience, education, achievements). Risumd supports an end-to-end backend workflow:

```text
Job → JD Analysis → Matching Engine → Resume Composition → Resume Version → LaTeX Template → PDF → Application → Status Tracking
```

---

## 1. Architecture & Pipeline Overview

Risumd Backend follows a clean modular monolith architecture with strict separation between API routing, validation schemas, business services, LaTeX rendering, and database persistence models:

```text
backend/
├── app/
│   ├── main.py                  # FastAPI entry point, CORS, and exception handlers
│   ├── ai/                      # Gemini AI Integration Module
│   │   ├── __init__.py          # AI exports
│   │   ├── client.py            # Gemini client initialization & API key validation
│   │   ├── prompts.py           # System instructions for JD analysis & resume wording
│   │   ├── jd_analyzer.py       # Structured JD analysis extraction
│   │   └── resume_writer.py     # Grounded resume wording refinement with fallback
│   ├── api/                     # Thin REST controllers
│   │   ├── router.py            # Master API router
│   │   ├── projects.py          # Project endpoints
│   │   ├── skills.py            # Skill endpoints
│   │   ├── technologies.py      # Technology endpoints
│   │   ├── experience.py        # Work experience endpoints
│   │   ├── education.py         # Education endpoints
│   │   ├── achievements.py      # Achievement endpoints
│   │   ├── jobs.py              # Job endpoints
│   │   ├── jd_analysis.py       # JD Analysis endpoints (including /generate)
│   │   ├── matches.py           # Career Matching endpoint
│   │   ├── resumes.py           # Resume Generation, Versioning & PDF endpoints
│   │   └── applications.py      # Application Tracking & Status History endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic Settings & environment configuration
│   │   └── exceptions.py        # Domain exceptions & HTTP error response handlers
│   ├── db/
│   │   └── database.py          # SQLAlchemy 2.0 Engine & SessionLocal dependency
│   ├── matching/                # Deterministic Matching Engine
│   │   ├── __init__.py          # Matching exports
│   │   ├── normalizer.py        # Normalizer & tech alias mapping
│   │   ├── weights.py           # Scoring weights & constants
│   │   ├── types.py             # MatchBreakdown & Ranked response schemas
│   │   └── scorer.py            # Pure, database-agnostic ranking & scoring pipeline
│   ├── models/                  # SQLAlchemy 2.0 Declarative Models
│   │   ├── base.py              # Base class & timestamp mixins
│   │   ├── associations.py      # Normalized M2M association tables
│   │   ├── project.py           # Project entity
│   │   ├── skill.py             # Skill entity
   ├── technology.py        # Technology entity
│   │   ├── experience.py        # Experience entity
│   │   ├── education.py         # Education entity
│   │   ├── achievement.py       # Achievement entity
│   │   ├── job.py               # Job entity
│   │   ├── jd_analysis.py       # JD Analysis entity (PostgreSQL JSONB fields)
│   │   ├── enums.py             # ApplicationStatus Enum
│   │   ├── resume_version.py    # Persistent ResumeVersion entity (JSONB snapshot)
│   │   ├── application.py       # Application tracking entity
│   │   └── application_status_history.py # Application status audit log entity
│   ├── resume/                  # Dedicated Resume Composition & PDF Module
│   │   ├── __init__.py
│   │   ├── constants.py         # Deterministic selection limits
│   │   ├── schemas.py           # Strongly-typed ResumeData Pydantic models
│   │   ├── renderer.py          # LaTeX character escaping, Jinja2 & Tectonic compiler
│   │   ├── composer.py          # Evidence selection & draft builder
│   │   └── templates/
│   │       └── default.tex      # Modern, ATS-friendly LaTeX template
│   └── services/                # Business logic & relational resolution
│       ├── project_service.py
│       ├── skill_service.py
│       ├── technology_service.py
│       ├── experience_service.py
│       ├── education_service.py
│       ├── achievement_service.py
│       ├── job_service.py
│       ├── jd_analysis_service.py
│       ├── matching_service.py
│       ├── resume_service.py    # Resume generation, versioning & PDF lookup
│       └── application_service.py # Application tracking & status history
├── alembic/                     # Database migrations
│   ├── env.py
│   └── versions/
│       ├── 001_initial_career_vault.py
│       ├── 002_job_and_jd_analysis.py
│       └── 003_resume_and_application_tracking.py
├── scripts/
│   └── seed.py                  # Development database seed script
├── storage/                     # Gitignored local storage for generated .tex and .pdf files
│   └── resumes/
├── tests/                       # Complete Pytest test suite (120 unit/integration tests)
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
│   ├── test_jd_analysis.py
│   ├── test_matching_normalizer.py
│   ├── test_matching_scorer.py
│   ├── test_matching_api.py
│   ├── test_ai_analyzer.py      # Unit tests for Gemini AI analyzer (mocked)
│   ├── test_ai_api.py           # Integration tests for /analysis/generate (mocked)
│   ├── test_resume_composer.py  # Tests for deterministic evidence selection
│   ├── test_resume_writer.py    # Tests for Gemini resume wording & fallback
│   ├── test_resume_renderer.py  # Tests for LaTeX character escaping & PDF compilation
│   ├── test_resume_api.py       # Integration tests for /resume/generate and PDF response
│   ├── test_application_tracking.py # Tests for application CRUD & status history
│   └── test_e2e_workflow.py    # Full end-to-end MVP integration test
├── alembic.ini                  # Alembic configuration
├── pyproject.toml               # Project dependencies & packaging
├── .gitignore
├── .env.example                 # Environment variable templates
└── README.md
```

---

## 2. Relational & Domain Architecture

```text
Job (1) <─────── (1) JDAnalysis
  │
  ├─── (1:N) ─── ResumeVersion (Immutable JSONB Snapshot + .tex + .pdf)
  │                   │
  └─── (1:N) ────── Application
                      │
                      └─── (1:N) ─── ApplicationStatusHistory
```

1. **Career Vault**: Canonical source of truth. Resume generation selects evidence but NEVER hallucinates or invents new facts, metrics, or technologies.
2. **Resume Snapshot**: `ResumeVersion` stores a complete, frozen JSONB snapshot of all data used to construct the resume. Edits to Career Vault never alter previously generated resumes.
3. **Immutability & Versioning**: Calling `POST /api/jobs/{id}/resume/generate` increments `version_number` (`v1`, `v2`, `v3`) while preserving older versions unchanged.
4. **LaTeX & PDF Rendering**: Template-based rendering using `jinja2` and standalone local `Tectonic` compiler. All user text is escaped against LaTeX special characters (`&, %, $, #, _, {, }, ~, ^, \`).
5. **Application Tracking**: `Application` links a Job and the **exact** `ResumeVersion` submitted (`resume_version.job_id == application.job_id`). Every status change generates an immutable `ApplicationStatusHistory` entry (`DRAFT`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`).

---

## 3. Prerequisites

* **Python**: 3.12+ (tested with Python 3.12, 3.13, and 3.14)
* **uv**: Fast Python package manager ([installation instructions](https://github.com/astral-sh/uv))
* **PostgreSQL**: Version 14+ running locally or accessible via network.
* **Tectonic**: Standalone offline LaTeX engine (`bin/tectonic.exe`).

---

## 4. Database Setup & Migrations

1. Create development and testing databases in PostgreSQL:
   ```sql
   CREATE DATABASE risumd;
   CREATE DATABASE risumd_test;
   ```

2. Configure `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd
   TEST_DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd_test
   ```

3. Run Alembic migrations:
   ```bash
   uv run alembic upgrade head
   ```

---

## 5. Running the Application

1. Hot-reloading development server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```

2. Run automated test suite:
   ```bash
   uv run pytest -v
   ```

---

## 6. Complete End-to-End Backend Workflow

```text
1. Create Job (`POST /api/jobs`)
        ↓
2. Generate JD Analysis (`POST /api/jobs/{id}/analysis/generate`)
        ↓
3. View Ranked Evidence (`GET /api/jobs/{id}/matches`)
        ↓
4. Generate Resume (`POST /api/jobs/{id}/resume/generate`)
        ↓
5. Download PDF (`GET /api/resumes/{id}/pdf`)
        ↓
6. Create Application (`POST /api/applications`)
        ↓
7. Update Status (`PATCH /api/applications/{id}`)
        ↓
8. Audit Trail (`GET /api/applications/{id}`)
```

---

## 7. API Documentation

Interactive API documentation available at:
* **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Core Endpoints

#### Resume Generation & PDF (`/api/resumes`)
* `POST /api/jobs/{id}/resume/generate` — Generate a tailored, versioned resume (JSON + LaTeX + PDF)
* `GET /api/jobs/{id}/resumes` — List all resume versions for a specific job
* `GET /api/resumes` — List all resume versions
* `GET /api/resumes/{id}` — Retrieve a specific resume version snapshot
* `GET /api/resumes/{id}/pdf` — Download the compiled PDF file

#### Application Tracking (`/api/applications`)
* `GET /api/applications` — List all applications
* `POST /api/applications` — Create a new job application (requires `job_id` and `resume_version_id`)
* `GET /api/applications/{id}` — Retrieve application details including complete status transition history
* `PATCH /api/applications/{id}` — Update application status, notes, or submission timestamp (records history)
* `DELETE /api/applications/{id}` — Delete an application



