from unittest.mock import MagicMock
import pytest
from app.models.achievement import Achievement
from app.models.education import Education
from app.models.experience import Experience
from app.models.project import Project
from app.models.skill import Skill
from app.models.technology import Technology


def test_full_risumd_end_to_end_mvp_workflow(client, db_session):
    # ----------------------------------------------------
    # Step 0: Populate Career Vault with rich evidence
    # ----------------------------------------------------
    py = Technology(name="Python")
    fa = Technology(name="FastAPI")
    pg = Technology(name="PostgreSQL")
    docker = Technology(name="Docker")

    sys_design = Skill(name="System Design", category="Core Skills")
    rest_api = Skill(name="REST API Design", category="Core Skills")

    ach1 = Achievement(title="Optimized database queries reducing latency by 40%", description="40% latency reduction")
    ach2 = Achievement(title="Built REST microservice handling 5M daily requests", description="5M daily requests")

    proj1 = Project(
        name="High Performance Gateway",
        description="Engineered API gateway in FastAPI",
        role="Lead Architect",
        technologies=[py, fa],
        skills=[sys_design, rest_api],
        achievements=[ach2],
    )

    exp1 = Experience(
        company="Stripe",
        role="Senior Backend Engineer",
        description="Developed core payment processing services",
        technologies=[py, pg, docker],
        skills=[sys_design],
        achievements=[ach1],
    )

    edu1 = Education(
        institution="Stanford University",
        degree="B.S. Computer Science",
        field="Computer Science",
    )

    db_session.add_all([py, fa, pg, docker, sys_design, rest_api, ach1, ach2, proj1, exp1, edu1])
    db_session.commit()

    # ----------------------------------------------------
    # Step 1: Create Job
    # ----------------------------------------------------
    job_payload = {
        "company": "OpenAI",
        "title": "Senior Staff Backend Engineer",
        "location": "San Francisco, CA",
        "raw_description": """
        We are seeking a Senior Staff Backend Engineer with strong experience in Python, FastAPI, PostgreSQL, and System Design.
        You will architect scalable microservices, optimize high-throughput databases, and lead backend API design.
        Nice to have: Docker and Kubernetes experience.
        """,
    }
    create_job_res = client.post("/api/jobs", json=job_payload)
    assert create_job_res.status_code == 201
    job_data = create_job_res.json()
    job_id = job_data["id"]

    # ----------------------------------------------------
    # Step 2: Generate JD Analysis (Simulate AI JD Analysis endpoint)
    # ----------------------------------------------------
    jd_analysis_payload = {
        "seniority": "Senior",
        "domain": "Backend Engineering",
        "required_skills": ["System Design", "REST API Design"],
        "preferred_skills": ["Microservices"],
        "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "responsibilities": ["Architect scalable microservices", "Optimize database queries"],
        "keywords": ["High Throughput", "Scalability"],
        "summary": "Senior backend role focusing on Python, FastAPI, and PostgreSQL scalability.",
    }
    jd_analysis_res = client.post(f"/api/jobs/{job_id}/analysis", json=jd_analysis_payload)
    assert jd_analysis_res.status_code == 201

    # ----------------------------------------------------
    # Step 3: View ranked Career Vault matches
    # ----------------------------------------------------
    matches_res = client.get(f"/api/jobs/{job_id}/matches")
    assert matches_res.status_code == 200
    match_data = matches_res.json()
    assert len(match_data["projects"]) > 0
    assert len(match_data["experiences"]) > 0
    assert match_data["projects"][0]["name"] == "High Performance Gateway"

    # ----------------------------------------------------
    # Step 4: Generate Tailored Resume (with mocked Gemini wording refinement)
    # ----------------------------------------------------
    resume_gen_res = client.post(
        f"/api/jobs/{job_id}/resume/generate?skip_ai=true",
        json={
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "location": "San Francisco, CA",
            "github": "https://github.com/janedoe",
        },
    )
    assert resume_gen_res.status_code == 201
    resume_ver = resume_gen_res.json()
    resume_ver_id = resume_ver["id"]

    assert resume_ver["job_id"] == job_id
    assert resume_ver["version_number"] == 1
    assert resume_ver["pdf_available"] is True
    assert resume_ver["resume_data"]["contact"]["name"] == "Jane Doe"
    assert len(resume_ver["resume_data"]["projects"]) > 0
    assert len(resume_ver["resume_data"]["experience"]) > 0

    # Verify LaTeX and PDF exist
    pdf_res = client.get(f"/api/resumes/{resume_ver_id}/pdf")
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 0

    # ----------------------------------------------------
    # Step 5: Create Job Application referencing exact ResumeVersion
    # ----------------------------------------------------
    app_payload = {
        "job_id": job_id,
        "resume_version_id": resume_ver_id,
        "status": "APPLIED",
        "notes": "Submitted application via OpenAI careers page.",
    }
    app_res = client.post("/api/applications", json=app_payload)
    assert app_res.status_code == 201
    app_data = app_res.json()
    app_id = app_data["id"]

    assert app_data["job_id"] == job_id
    assert app_data["resume_version_id"] == resume_ver_id
    assert app_data["status"] == "APPLIED"
    assert len(app_data["status_history"]) == 1

    # ----------------------------------------------------
    # Step 6: Advance Application Status across workflow states
    # ----------------------------------------------------
    # State 1 -> SCREENING
    s1 = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "SCREENING", "status_change_note": "Recruiter phone screen scheduled for Thursday."},
    )
    assert s1.status_code == 200

    # State 2 -> INTERVIEW
    s2 = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "INTERVIEW", "status_change_note": "Technical system design round passed."},
    )
    assert s2.status_code == 200

    # State 3 -> OFFER
    s3 = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "OFFER", "status_change_note": "Formal offer extended!"},
    )
    assert s3.status_code == 200

    # ----------------------------------------------------
    # Step 7: Verify Complete Application Audit Trail
    # ----------------------------------------------------
    final_app_res = client.get(f"/api/applications/{app_id}")
    assert final_app_res.status_code == 200
    final_app = final_app_res.json()

    assert final_app["status"] == "OFFER"
    # 1 creation + 3 status updates = 4 history records
    history = final_app["status_history"]
    assert len(history) == 4
    assert history[0]["new_status"] == "OFFER"
    assert history[0]["old_status"] == "INTERVIEW"
    assert history[1]["new_status"] == "INTERVIEW"
    assert history[1]["old_status"] == "SCREENING"
    assert history[2]["new_status"] == "SCREENING"
    assert history[2]["old_status"] == "APPLIED"
    assert history[3]["new_status"] == "APPLIED"
    assert history[3]["old_status"] is None
