import pytest
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.project import Project
from app.models.skill import Skill
from app.models.technology import Technology


def test_resume_generation_flow_and_versioning(client, db_session):
    py_tech = Technology(name="Python")
    fa_tech = Technology(name="FastAPI")
    db_session.add_all([py_tech, fa_tech])
    db_session.commit()

    proj = Project(name="Project Alpha", description="FastAPI app", technologies=[py_tech, fa_tech])
    db_session.add(proj)

    job = Job(company="Acme Corp", title="Backend Engineer", raw_description="Need Python FastAPI developer")
    db_session.add(job)
    db_session.commit()

    jd_analysis = JDAnalysis(
        job_id=job.id,
        seniority="Senior",
        domain="Backend",
        required_skills=["REST APIs"],
        technologies=["Python", "FastAPI"],
        summary="Acme backend role",
    )
    db_session.add(jd_analysis)
    db_session.commit()

    # 1. First generation -> Version 1
    res1 = client.post(f"/api/jobs/{job.id}/resume/generate?skip_ai=true")
    assert res1.status_code == 201
    v1_data = res1.json()
    assert v1_data["job_id"] == job.id
    assert v1_data["version_number"] == 1
    assert v1_data["pdf_available"] is True
    assert v1_data["resume_data"]["contact"]["name"] == "Candidate Name"

    # 2. Second generation -> Version 2
    res2 = client.post(
        f"/api/jobs/{job.id}/resume/generate?skip_ai=true",
        json={"name": "Custom Candidate Name", "email": "custom@example.com"},
    )
    assert res2.status_code == 201
    v2_data = res2.json()
    assert v2_data["job_id"] == job.id
    assert v2_data["version_number"] == 2
    assert v2_data["resume_data"]["contact"]["name"] == "Custom Candidate Name"

    # 3. Verify Version 1 remains unchanged in database (Immutability check)
    get_v1 = client.get(f"/api/resumes/{v1_data['id']}")
    assert get_v1.status_code == 200
    assert get_v1.json()["version_number"] == 1
    assert get_v1.json()["resume_data"]["contact"]["name"] == "Candidate Name"

    # 4. List resumes for job
    res_list = client.get(f"/api/jobs/{job.id}/resumes")
    assert res_list.status_code == 200
    versions = res_list.json()
    assert len(versions) == 2
    assert versions[0]["version_number"] in [1, 2]

    # 5. Fetch PDF
    pdf_res = client.get(f"/api/resumes/{v1_data['id']}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 0


def test_resume_generation_missing_job_404(client):
    res = client.post("/api/jobs/99999/resume/generate")
    assert res.status_code == 404


def test_resume_generation_missing_analysis_400(client, db_session):
    job = Job(company="No Analysis Co", title="Developer", raw_description="No analysis present")
    db_session.add(job)
    db_session.commit()

    res = client.post(f"/api/jobs/{job.id}/resume/generate")
    assert res.status_code == 400
    assert "JD analysis" in res.json()["detail"]
