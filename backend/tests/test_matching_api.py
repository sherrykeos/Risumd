from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.project import Project
from app.models.experience import Experience
from app.models.skill import Skill
from app.models.technology import Technology
from app.models.achievement import Achievement


def test_get_matches_valid_job_and_analysis(client: TestClient, db_session: Session):
    # 1. Create Job + JDAnalysis
    job = Job(
        company="Acme Cloud",
        title="Senior Backend Engineer",
        raw_description="Looking for a Python and PostgreSQL backend engineer.",
    )
    db_session.add(job)
    db_session.flush()

    analysis = JDAnalysis(
        job_id=job.id,
        seniority="Senior",
        domain="Backend",
        required_skills=["Backend Architecture", "System Design"],
        preferred_skills=["Docker"],
        technologies=["Python", "PostgreSQL", "FastAPI"],
        responsibilities=["Build distributed microservices", "Optimize database queries"],
        keywords=["microservices", "caching", "low-latency"],
        summary="Senior Backend Engineer role building cloud microservices.",
    )
    db_session.add(analysis)

    # 2. Add Career Vault items
    tech_py = Technology(name="Python")
    tech_pg = Technology(name="PostgreSQL")
    tech_react = Technology(name="React")
    skill_arch = Skill(name="Backend Architecture", category="Engineering")
    skill_ui = Skill(name="UI Design", category="Design")
    db_session.add_all([tech_py, tech_pg, tech_react, skill_arch, skill_ui])
    db_session.flush()

    # Highly relevant project
    proj1 = Project(
        name="Scalable Microservices Platform",
        role="Lead Backend Engineer",
        description="Built low-latency microservices with Python and PostgreSQL",
        technologies=[tech_py, tech_pg],
        skills=[skill_arch],
    )
    # Unrelated project
    proj2 = Project(
        name="Front-end Dashboard",
        role="UI Designer",
        description="React UI dashboard with styled components",
        technologies=[tech_react],
        skills=[skill_ui],
    )
    db_session.add_all([proj1, proj2])
    db_session.commit()

    # 3. Call GET /api/jobs/{id}/matches
    response = client.get(f"/api/jobs/{job.id}/matches")
    assert response.status_code == 200
    data = response.json()

    assert data["job_id"] == job.id
    assert data["job_title"] == "Senior Backend Engineer"
    assert data["company"] == "Acme Cloud"

    # Projects ranked: proj1 must be first with higher score
    assert len(data["projects"]) == 2
    assert data["projects"][0]["id"] == proj1.id
    assert data["projects"][0]["score"] > data["projects"][1]["score"]
    assert "Python" in data["projects"][0]["matched_technologies"]
    assert "PostgreSQL" in data["projects"][0]["matched_technologies"]
    assert "Backend Architecture" in data["projects"][0]["matched_skills"]

    # Match breakdown is present and explainable
    breakdown = data["projects"][0]["match_breakdown"]
    assert breakdown["score"] > 0.0
    assert len(breakdown["reasons"]) > 0

    # Supporting items
    assert len(data["technologies"]) >= 2
    assert len(data["skills"]) >= 2


def test_get_matches_missing_job_returns_404(client: TestClient):
    response = client.get("/api/jobs/99999/matches")
    assert response.status_code == 404
    assert "Job with id '99999' not found" in response.json()["detail"]


def test_get_matches_missing_analysis_returns_400(client: TestClient, db_session: Session):
    # Create job with NO analysis
    job = Job(
        company="Startup Co",
        title="Full Stack Developer",
        raw_description="Looking for a full stack engineer.",
    )
    db_session.add(job)
    db_session.commit()

    response = client.get(f"/api/jobs/{job.id}/matches")
    assert response.status_code == 400
    assert "does not have a JD analysis. Matching requires a structured analysis." in response.json()["detail"]


def test_get_matches_empty_career_vault_handled_gracefully(client: TestClient, db_session: Session):
    # Job + Analysis, but Career Vault is completely empty
    job = Job(
        company="Empty Vault Tech",
        title="Software Engineer",
        raw_description="Software engineer role.",
    )
    db_session.add(job)
    db_session.flush()

    analysis = JDAnalysis(
        job_id=job.id,
        technologies=["Python"],
        required_skills=["Backend"],
    )
    db_session.add(analysis)
    db_session.commit()

    response = client.get(f"/api/jobs/{job.id}/matches")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == job.id
    assert data["projects"] == []
    assert data["experiences"] == []
    assert data["skills"] == []
    assert data["technologies"] == []
    assert data["achievements"] == []

