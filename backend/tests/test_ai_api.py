from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.exceptions import GeminiConfigurationException, GeminiServiceException
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.project import Project
from app.models.technology import Technology
from app.schemas.jd_analysis import JDAnalysisCreate


MOCK_ANALYSIS_DATA = JDAnalysisCreate(
    seniority="Lead",
    domain="Cloud Architecture",
    required_skills=["Distributed Systems", "Cloud Security"],
    preferred_skills=["Terraform"],
    technologies=["Python", "Go", "Docker", "Kubernetes", "PostgreSQL"],
    responsibilities=[
        "Lead cloud architecture design and migration",
        "Maintain zero-downtime Kubernetes infrastructure",
    ],
    keywords=["cloud", "Kubernetes", "infrastructure", "distributed"],
    summary="Lead Cloud Architect role overseeing distributed infrastructure and Kubernetes clusters.",
)


def test_generate_analysis_success(client: TestClient, db_session: Session):
    job = Job(
        company="Aurora Cloud",
        title="Lead Cloud Architect",
        raw_description="We are seeking a Lead Cloud Architect with deep knowledge of Kubernetes and Go.",
    )
    db_session.add(job)
    db_session.commit()

    with patch("app.services.jd_analysis_service.analyze_job_description", return_value=MOCK_ANALYSIS_DATA):
        response = client.post(f"/api/jobs/{job.id}/analysis/generate")

    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == job.id
    assert data["seniority"] == "Lead"
    assert data["domain"] == "Cloud Architecture"
    assert "Kubernetes" in data["technologies"]
    assert "Distributed Systems" in data["required_skills"]
    assert len(data["responsibilities"]) == 2

    # Verify persistence in database
    db_analysis = db_session.query(JDAnalysis).filter(JDAnalysis.job_id == job.id).first()
    assert db_analysis is not None
    assert db_analysis.seniority == "Lead"


def test_generate_analysis_updates_existing_in_place(client: TestClient, db_session: Session):
    # Job with an existing analysis
    job = Job(
        company="Apex Systems",
        title="Systems Engineer",
        raw_description="Systems Engineer job description.",
    )
    db_session.add(job)
    db_session.flush()

    existing_analysis = JDAnalysis(
        job_id=job.id,
        seniority="Junior",
        domain="IT Support",
        technologies=["Bash"],
    )
    db_session.add(existing_analysis)
    db_session.commit()

    # Generate new analysis with Lead seniority
    with patch("app.services.jd_analysis_service.analyze_job_description", return_value=MOCK_ANALYSIS_DATA):
        response = client.post(f"/api/jobs/{job.id}/analysis/generate")

    assert response.status_code == 200
    data = response.json()
    assert data["seniority"] == "Lead"
    assert data["domain"] == "Cloud Architecture"

    # Refresh session identity map after client request commits
    db_session.expire_all()

    # Enforce that NO duplicate row was created
    all_analyses = db_session.query(JDAnalysis).filter(JDAnalysis.job_id == job.id).all()
    assert len(all_analyses) == 1
    assert all_analyses[0].id == existing_analysis.id
    assert all_analyses[0].seniority == "Lead"



def test_generate_analysis_missing_job_returns_404(client: TestClient):
    with patch("app.services.jd_analysis_service.analyze_job_description", return_value=MOCK_ANALYSIS_DATA):
        response = client.post("/api/jobs/99999/analysis/generate")
    assert response.status_code == 404
    assert "Job with id '99999' not found" in response.json()["detail"]


def test_generate_analysis_empty_raw_description_returns_422(client: TestClient, db_session: Session):
    job = Job(
        company="Blank Co",
        title="Empty Description Role",
        raw_description="",
    )
    db_session.add(job)
    db_session.commit()

    response = client.post(f"/api/jobs/{job.id}/analysis/generate")
    assert response.status_code == 422
    assert "empty raw_description" in response.json()["detail"]


def test_generate_analysis_missing_api_key_returns_500(client: TestClient, db_session: Session):
    job = Job(
        company="Cloud Corp",
        title="Backend Engineer",
        raw_description="Valid job description for backend engineer.",
    )
    db_session.add(job)
    db_session.commit()

    with patch(
        "app.services.jd_analysis_service.analyze_job_description",
        side_effect=GeminiConfigurationException("Gemini API key is not configured."),
    ):
        response = client.post(f"/api/jobs/{job.id}/analysis/generate")

    assert response.status_code == 500
    assert "Gemini API key is not configured" in response.json()["detail"]


def test_generate_analysis_provider_error_returns_502(client: TestClient, db_session: Session):
    job = Job(
        company="Cloud Corp",
        title="Backend Engineer",
        raw_description="Valid job description for backend engineer.",
    )
    db_session.add(job)
    db_session.commit()

    with patch(
        "app.services.jd_analysis_service.analyze_job_description",
        side_effect=GeminiServiceException("Gemini API error: Service Unavailable"),
    ):
        response = client.post(f"/api/jobs/{job.id}/analysis/generate")

    assert response.status_code == 502
    assert "Gemini API error" in response.json()["detail"]


def test_generate_analysis_then_matches_pipeline(client: TestClient, db_session: Session):
    # End-to-end integration: Generate analysis -> matching engine
    job = Job(
        company="Fintech Dynamics",
        title="Platform Engineer",
        raw_description="Platform role requiring Kubernetes, Docker, and Python.",
    )
    db_session.add(job)
    db_session.flush()

    # Add matching Career Vault project
    tech_k8s = Technology(name="Kubernetes")
    tech_py = Technology(name="Python")
    db_session.add_all([tech_k8s, tech_py])
    db_session.flush()

    proj = Project(
        name="Container Orchestration Platform",
        role="DevOps Lead",
        description="Built internal developer platform with Kubernetes and Python",
        technologies=[tech_k8s, tech_py],
    )
    db_session.add(proj)
    db_session.commit()

    # 1. Generate analysis via AI endpoint
    with patch("app.services.jd_analysis_service.analyze_job_description", return_value=MOCK_ANALYSIS_DATA):
        gen_res = client.post(f"/api/jobs/{job.id}/analysis/generate")
    assert gen_res.status_code == 200

    # 2. Immediately call matching endpoint
    matches_res = client.get(f"/api/jobs/{job.id}/matches")
    assert matches_res.status_code == 200
    match_data = matches_res.json()

    assert match_data["job_id"] == job.id
    assert len(match_data["projects"]) >= 1
    top_project = match_data["projects"][0]
    assert top_project["id"] == proj.id
    assert "Kubernetes" in top_project["matched_technologies"]
    assert top_project["score"] > 0.0
