# Risumd — Backend Multi-User Foundation (Google OAuth 2.0, Career Vault, Matching, Resume Engine & PDF)

Backend foundation for **Risumd**, a personal career-management and tailored-resume application.

Risumd is built around a single canonical source of truth: the **Career Vault**. The vault holds reusable career evidence (projects, skills, technologies, experience, education, achievements) strictly isolated per user. Risumd supports an end-to-end multi-user workflow:

```text
Google OAuth 2.0 → Secure Session Cookie → Career Vault (Isolated) → Job & Analysis → Matching Engine → Tailored Resume → PDF → Application Tracking
```

---

## 1. Authentication & Multi-User Architecture

Risumd uses **Google OAuth 2.0** as its single authentication provider combined with secure, database-backed HTTP session cookies:

1. **OAuth 2.0 Flow**: The user signs in with Google (`/api/auth/google/login`). Google redirects to `/api/auth/google/callback` with an authorization code and CSRF state token.
2. **Identity Resolution**: The backend retrieves the user's stable `google_sub`, `email`, `name`, and `avatar_url`, and upserts the `User` record in PostgreSQL.
3. **Session Management**: A cryptographically random session token (48 bytes URL-safe) is stored in the `user_sessions` table with an expiration timestamp (`expires_at`).
4. **Secure Cookie**: The session token is transmitted in an `HttpOnly`, `SameSite=lax`, `Secure` (in production) cookie (`risumd_session`). No raw tokens or user IDs are stored in browser local storage.
5. **FastAPI Auth Dependency**: All protected routes resolve the authenticated user via `get_current_user` dependency (`Depends(get_current_user)`).
6. **Data Isolation & IDOR Protection**: Every SQL query across Career Vault, Jobs, Matching, Resume Generation, PDF streaming, and Applications is scoped to `current_user.id`. Cross-user access attempts result in safe `404 Not Found` responses.

---

## 2. Architecture & Pipeline Overview

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
│   │   ├── auth.py              # Google OAuth login, callback, /me, and logout
│   │   ├── deps.py              # get_current_user & get_current_user_optional dependencies
│   │   ├── projects.py          # Project endpoints (user-scoped)
│   │   ├── skills.py            # Skill endpoints (user-scoped)
│   │   ├── technologies.py      # Technology endpoints (user-scoped)
│   │   ├── experience.py        # Work experience endpoints (user-scoped)
│   │   ├── education.py         # Education endpoints (user-scoped)
│   │   ├── achievements.py      # Achievement endpoints (user-scoped)
│   │   ├── jobs.py              # Job endpoints (user-scoped)
│   │   ├── jd_analysis.py       # JD Analysis endpoints (user-scoped)
│   │   ├── matches.py           # Career Matching endpoint (user-scoped)
│   │   ├── resumes.py           # Resume Generation, Versioning & PDF endpoints (user-scoped)
│   │   └── applications.py      # Application Tracking & Status History endpoints (user-scoped)
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
* **PostgreSQL**: Version 14+ running locally (e.g., PostgreSQL service / Docker) or hosted (e.g., Neon, Supabase).
* **Tectonic**: Standalone offline LaTeX engine (`bin/tectonic.exe`).

---

## 4. Environment & Database Setup

### Step 1: Navigate to the Backend Directory
Always make sure your terminal is inside the `backend/` directory before executing `uv` commands:
```bash
cd backend
```

### Step 2: Install Dependencies
Sync the virtual environment and install all runtime & development dependencies:
```bash
uv sync
```

### Step 3: Configure Environment Variables
Create your `.env` file from `.env.example`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS / Git Bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL database credentials and optional Gemini AI API key:
```env
# Database Configuration
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd
TEST_DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/risumd_test

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Application Configuration
API_PREFIX=/api
API_V1_PREFIX=/api
ENVIRONMENT=development
PROJECT_NAME="Risumd Backend"

# Google Gemini AI Configuration (optional, required for AI analysis & wording)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Step 4: Run Database Migrations
Apply the database schema using Alembic:
```bash
uv run alembic upgrade head
```

*(Optional)* Seed development database with sample Career Vault data:
```bash
uv run python scripts/seed.py
```

---

## 5. Running the Application & Tests

### Start the Development Server
Run the FastAPI development server with hot-reload enabled:
```bash
uv run uvicorn app.main:app --reload
```
The server will start at:
* **Base API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

> **Alternative (using activated virtual environment directly):**
> ```bash
> # Windows (PowerShell)
> .venv\Scripts\Activate.ps1
> uvicorn app.main:app --reload
>
> # Linux / macOS
> source .venv/bin/activate
> uvicorn app.main:app --reload
> ```

### Run Automated Tests
Execute the Pytest test suite:
```bash
uv run pytest -v
```

> [!NOTE]
> **Troubleshooting `Failed to spawn: pytest` / `program not found`**:
> If you encounter `error: Failed to spawn: pytest`, check the following:
> 1. Ensure your current working directory is `backend` (`cd backend`). If executing from the project root, use `uv --directory backend run pytest -v`.
> 2. Ensure dependencies are installed by running `uv sync`.

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



