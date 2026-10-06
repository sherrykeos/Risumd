import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.main import app
from app.models.achievement import Achievement
from app.models.education import Education
from app.models.experience import Experience
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.project import Project
from app.models.skill import Skill
from app.models.technology import Technology
from app.models.user import User
from app.models.resume_version import ResumeVersion
from app.services.resume_service import resume_service


from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.models.session import UserSession


@pytest.fixture
def user_a(db_session: Session) -> User:
    user = User(
        google_sub="google_sub_user_a",
        email="usera@example.com",
        name="User A",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    session = UserSession(
        session_token="token_user_a",
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(session)
    db_session.commit()
    return user


@pytest.fixture
def user_b(db_session: Session) -> User:
    user = User(
        google_sub="google_sub_user_b",
        email="userb@example.com",
        name="User B",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    session = UserSession(
        session_token="token_user_b",
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(session)
    db_session.commit()
    return user


@pytest.fixture
def client_a(user_a: User):
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as c:
        c.cookies.set(settings.SESSION_COOKIE_NAME, "token_user_a")
        yield c


@pytest.fixture
def client_b(user_b: User):
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as c:
        c.cookies.set(settings.SESSION_COOKIE_NAME, "token_user_b")
        yield c


# -----------------------------------------------------------------------------
# 1. Career Vault Isolation Tests (Projects, Skills, Technologies, Experience, Education, Achievements)
# -----------------------------------------------------------------------------

def test_project_isolation(client_a, client_b):
    # User A creates a project
    res_a = client_a.post("/api/projects", json={"name": "User A Secret Project", "role": "Lead"})
    assert res_a.status_code == 201
    proj_a_id = res_a.json()["id"]

    # User B cannot see project in list
    list_b = client_b.get("/api/projects")
    assert list_b.status_code == 200
    assert not any(p["id"] == proj_a_id for p in list_b.json())

    # User B cannot GET project by ID (IDOR prevention)
    get_b = client_b.get(f"/api/projects/{proj_a_id}")
    assert get_b.status_code == 404

    # User B cannot PATCH project
    patch_b = client_b.patch(f"/api/projects/{proj_a_id}", json={"name": "Hacked Project"})
    assert patch_b.status_code == 404

    # User B cannot DELETE project
    del_b = client_b.delete(f"/api/projects/{proj_a_id}")
    assert del_b.status_code == 404

    # User A can still retrieve the project intact
    get_a = client_a.get(f"/api/projects/{proj_a_id}")
    assert get_a.status_code == 200
    assert get_a.json()["name"] == "User A Secret Project"


def test_per_user_skills_and_technologies_unique_namespace(client_a, client_b):
    # User A and User B can both create "Python" skill and technology independently
    res_skill_a = client_a.post("/api/skills", json={"name": "Python", "category": "Languages"})
    assert res_skill_a.status_code == 201

    res_skill_b = client_b.post("/api/skills", json={"name": "Python", "category": "Data Science"})
    assert res_skill_b.status_code == 201
    assert res_skill_b.json()["id"] != res_skill_a.json()["id"]

    # User A sees their version of Python skill
    list_skill_a = client_a.get("/api/skills")
    assert len(list_skill_a.json()) == 1
    assert list_skill_a.json()[0]["category"] == "Languages"

    # User B sees their version of Python skill
    list_skill_b = client_b.get("/api/skills")
    assert len(list_skill_b.json()) == 1
    assert list_skill_b.json()[0]["category"] == "Data Science"

    # Same for technologies
    res_tech_a = client_a.post("/api/technologies", json={"name": "FastAPI"})
    res_tech_b = client_b.post("/api/technologies", json={"name": "FastAPI"})
    assert res_tech_a.status_code == 201
    assert res_tech_b.status_code == 201
    assert res_tech_a.json()["id"] != res_tech_b.json()["id"]


def test_experience_and_education_and_achievements_isolation(client_a, client_b):
    # User A creates experience, education, achievement
    exp_a = client_a.post("/api/experience", json={"company": "User A Corp", "role": "Senior Dev"}).json()
    edu_a = client_a.post("/api/education", json={"institution": "User A University", "degree": "BS"}).json()
    ach_a = client_a.post("/api/achievements", json={"title": "User A Achievement"}).json()

    # User B lists items and sees none of User A's records
    assert len(client_b.get("/api/experience").json()) == 0
    assert len(client_b.get("/api/education").json()) == 0
    assert len(client_b.get("/api/achievements").json()) == 0

    # User B cannot direct-access by ID
    assert client_b.get(f"/api/experience/{exp_a['id']}").status_code == 404
    assert client_b.get(f"/api/education/{edu_a['id']}").status_code == 404
    assert client_b.get(f"/api/achievements/{ach_a['id']}").status_code == 404


# -----------------------------------------------------------------------------
# 2. Jobs, JD Analysis, and Matching Engine Isolation Tests
# -----------------------------------------------------------------------------

def test_job_and_analysis_isolation(client_a, client_b):
    # User A creates a job
    job_a = client_a.post("/api/jobs", json={
        "company": "Company A",
        "title": "Backend Architect",
        "raw_description": "Architect needed for distributed systems",
    }).json()
    job_a_id = job_a["id"]

    # User B cannot GET, PATCH, DELETE User A's job
    assert client_b.get(f"/api/jobs/{job_a_id}").status_code == 404
    assert client_b.patch(f"/api/jobs/{job_a_id}", json={"company": "Hacked"}).status_code == 404
    assert client_b.delete(f"/api/jobs/{job_a_id}").status_code == 404

    # User B cannot generate or post analysis for User A's job
    analysis_payload = {
        "seniority": "Senior",
        "domain": "Backend",
        "technologies": ["Python"],
        "required_skills": ["System Design"],
    }
    assert client_b.post(f"/api/jobs/{job_a_id}/analysis", json=analysis_payload).status_code == 404
    assert client_b.post(f"/api/jobs/{job_a_id}/analysis/generate").status_code == 404


def test_matching_engine_never_leaks_other_user_vault_items(client_a, client_b):
    # Setup User A: Job looking for "Python" and "PostgreSQL", and Vault project "User A Project"
    job_a = client_a.post("/api/jobs", json={
        "company": "Company Alpha",
        "title": "Python Specialist",
        "raw_description": "We need Python and PostgreSQL expertise.",
    }).json()
    job_a_id = job_a["id"]

    client_a.post(f"/api/jobs/{job_a_id}/analysis", json={
        "seniority": "Senior",
        "domain": "Backend",
        "technologies": ["Python", "PostgreSQL"],
        "required_skills": ["Backend Arch"],
    })

    client_a.post("/api/projects", json={
        "name": "User A Python Project",
        "technologies": ["Python"],
    })

    # Setup User B: Has Vault project "User B SUPER SECRET Python Project" with high match keyword
    client_b.post("/api/projects", json={
        "name": "User B SUPER SECRET Python Project",
        "technologies": ["Python", "PostgreSQL"],
        "skills": ["Backend Arch"],
    })

    # User A matches for Job A
    matches_a_res = client_a.get(f"/api/jobs/{job_a_id}/matches")
    assert matches_a_res.status_code == 200
    matches_a = matches_a_res.json()

    project_names = [p["name"] for p in matches_a["projects"]]
    assert "User A Python Project" in project_names
    # CRITICAL: User B's project must NEVER appear in User A's match results
    assert "User B SUPER SECRET Python Project" not in project_names

    # User B cannot run matching on User A's job
    assert client_b.get(f"/api/jobs/{job_a_id}/matches").status_code == 404


# -----------------------------------------------------------------------------
# 3. Resume Generation, Versioning, and PDF Isolation Tests
# -----------------------------------------------------------------------------

def test_resume_generation_and_pdf_isolation(client_a, client_b):
    # Setup Job and analysis for User A
    job_a = client_a.post("/api/jobs", json={
        "company": "Target Alpha",
        "title": "Lead Engineer",
        "raw_description": "Lead Python Engineer role.",
    }).json()
    job_a_id = job_a["id"]

    client_a.post(f"/api/jobs/{job_a_id}/analysis", json={
        "seniority": "Lead",
        "domain": "Backend",
        "technologies": ["Python"],
        "required_skills": ["Leadership"],
        "summary": "Lead role",
    })

    # User A adds a project
    client_a.post("/api/projects", json={"name": "User A Platform", "technologies": ["Python"]})

    # User A generates a resume
    gen_res = client_a.post(f"/api/jobs/{job_a_id}/resume/generate?skip_ai=true")
    assert gen_res.status_code == 201
    resume_a = gen_res.json()
    resume_a_id = resume_a["id"]

    # User B attempts to generate a resume on User A's job -> 404
    gen_b = client_b.post(f"/api/jobs/{job_a_id}/resume/generate?skip_ai=true")
    assert gen_b.status_code == 404

    # User B attempts to access User A's resume version metadata -> 404
    get_res_b = client_b.get(f"/api/resumes/{resume_a_id}")
    assert get_res_b.status_code == 404

    # User B attempts to list resumes for User A's job -> returns empty list
    list_b = client_b.get(f"/api/jobs/{job_a_id}/resumes")
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B attempts to download User A's resume PDF -> 404
    pdf_b = client_b.get(f"/api/resumes/{resume_a_id}/pdf")
    assert pdf_b.status_code == 404

    # User A can download their PDF successfully
    pdf_a = client_a.get(f"/api/resumes/{resume_a_id}/pdf")
    assert pdf_a.status_code == 200
    assert pdf_a.headers["content-type"] == "application/pdf"


# -----------------------------------------------------------------------------
# 4. Applications and Status History Isolation Tests
# -----------------------------------------------------------------------------

def test_application_isolation_and_cross_tenant_prevention(client_a, client_b):
    # Setup User A Job and Resume
    job_a = client_a.post("/api/jobs", json={
        "company": "Application Target A",
        "title": "Engineer",
        "raw_description": "Description",
    }).json()
    client_a.post(f"/api/jobs/{job_a['id']}/analysis", json={"summary": "Summary"})
    resume_a = client_a.post(f"/api/jobs/{job_a['id']}/resume/generate?skip_ai=true").json()

    # User A creates Application
    app_a = client_a.post("/api/applications", json={
        "job_id": job_a["id"],
        "resume_version_id": resume_a["id"],
        "status": "APPLIED",
        "notes": "User A application notes",
    }).json()
    app_a_id = app_a["id"]

    # User B cannot see User A's application in list
    assert len(client_b.get("/api/applications").json()) == 0

    # User B cannot GET User A's application details
    assert client_b.get(f"/api/applications/{app_a_id}").status_code == 404

    # User B cannot PATCH User A's application status
    patch_b = client_b.patch(f"/api/applications/{app_a_id}", json={"status": "REJECTED"})
    assert patch_b.status_code == 404

    # User B cannot DELETE User A's application
    assert client_b.delete(f"/api/applications/{app_a_id}").status_code == 404

    # User B cannot create an application linking User A's job or resume
    create_cross_b = client_b.post("/api/applications", json={
        "job_id": job_a["id"],
        "resume_version_id": resume_a["id"],
        "status": "APPLIED",
    })
    assert create_cross_b.status_code == 404
