import pytest
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.resume_version import ResumeVersion
from app.services.resume_service import resume_service


def _setup_job_and_resume(db_session, job_company="Test Corp"):
    job = Job(company=job_company, title="Backend Engineer", raw_description="Job description")
    db_session.add(job)
    db_session.commit()

    jd_analysis = JDAnalysis(job_id=job.id, summary="JD summary")
    db_session.add(jd_analysis)
    db_session.commit()

    version = resume_service.generate_resume(db=db_session, job_id=job.id, skip_ai=True)
    return job, version


def test_application_creation_and_status_history(client, db_session):
    job, version = _setup_job_and_resume(db_session)

    # 1. Create Application
    create_res = client.post(
        "/api/applications",
        json={
            "job_id": job.id,
            "resume_version_id": version.id,
            "status": "APPLIED",
            "notes": "Applied via company portal",
        },
    )
    assert create_res.status_code == 201
    app_data = create_res.json()
    assert app_data["job_id"] == job.id
    assert app_data["resume_version_id"] == version.id
    assert app_data["status"] == "APPLIED"
    assert app_data["applied_at"] is not None
    assert len(app_data["status_history"]) == 1
    assert app_data["status_history"][0]["new_status"] == "APPLIED"

    app_id = app_data["id"]

    # 2. Update Status to SCREENING
    patch_res = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "SCREENING", "status_change_note": "HR recruiter call scheduled"},
    )
    assert patch_res.status_code == 200
    patched_data = patch_res.json()
    assert patched_data["status"] == "SCREENING"
    assert len(patched_data["status_history"]) == 2
    assert patched_data["status_history"][0]["old_status"] == "APPLIED"
    assert patched_data["status_history"][0]["new_status"] == "SCREENING"
    assert patched_data["status_history"][0]["note"] == "HR recruiter call scheduled"

    # 3. Update Status to INTERVIEW
    patch_res2 = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "INTERVIEW", "notes": "Passed HR screen, technical interview next"},
    )
    assert patch_res2.status_code == 200
    patched_data2 = patch_res2.json()
    assert patched_data2["status"] == "INTERVIEW"
    assert len(patched_data2["status_history"]) == 3
    assert patched_data2["status_history"][0]["old_status"] == "SCREENING"
    assert patched_data2["status_history"][0]["new_status"] == "INTERVIEW"

    # 4. Get Application details
    get_res = client.get(f"/api/applications/{app_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "INTERVIEW"

    # 5. Delete Application
    del_res = client.delete(f"/api/applications/{app_id}")
    assert del_res.status_code == 204

    # 6. Verify 404 after deletion
    get_missing = client.get(f"/api/applications/{app_id}")
    assert get_missing.status_code == 404


def test_application_mismatched_job_and_resume_rejected(client, db_session):
    jobA, versionA = _setup_job_and_resume(db_session, job_company="Company A")
    jobB, versionB = _setup_job_and_resume(db_session, job_company="Company B")

    # Try to create Application with Job A and Resume generated for Job B
    res = client.post(
        "/api/applications",
        json={
            "job_id": jobA.id,
            "resume_version_id": versionB.id,
            "status": "APPLIED",
        },
    )
    assert res.status_code == 400
    assert "belongs to Job" in res.json()["detail"]
