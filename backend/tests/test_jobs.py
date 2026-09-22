def test_create_job_basic(client):
    response = client.post(
        "/api/jobs",
        json={
            "company": "Stripe",
            "title": "Senior Backend Engineer",
            "location": "Remote, US",
            "source_url": "https://stripe.com/jobs/123",
            "raw_description": "We are seeking a senior backend engineer to build scalable payment infrastructure.",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["company"] == "Stripe"
    assert data["title"] == "Senior Backend Engineer"
    assert data["location"] == "Remote, US"
    assert data["source_url"] == "https://stripe.com/jobs/123"
    assert "payment infrastructure" in data["raw_description"]
    assert data["analysis"] is None
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_get_job(client):
    create_res = client.post(
        "/api/jobs",
        json={
            "company": "Datadog",
            "title": "Software Engineer",
            "raw_description": "Build telemetry pipeline.",
        }
    )
    job_id = create_res.json()["id"]

    res = client.get(f"/api/jobs/{job_id}")
    assert res.status_code == 200
    assert res.json()["company"] == "Datadog"
    assert res.json()["title"] == "Software Engineer"


def test_get_missing_job_404(client):
    res = client.get("/api/jobs/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_jobs(client):
    client.post("/api/jobs", json={"company": "Company A", "title": "Dev A", "raw_description": "Desc A"})
    client.post("/api/jobs", json={"company": "Company B", "title": "Dev B", "raw_description": "Desc B"})

    res = client.get("/api/jobs")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 2


def test_update_job(client):
    create_res = client.post(
        "/api/jobs",
        json={"company": "Old Corp", "title": "Junior Dev", "raw_description": "Initial description"}
    )
    job_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/jobs/{job_id}",
        json={
            "company": "New Corp",
            "title": "Mid Dev",
            "location": "Bengaluru",
            "source_url": "https://newcorp.com/careers",
        }
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["company"] == "New Corp"
    assert data["title"] == "Mid Dev"
    assert data["location"] == "Bengaluru"
    assert data["source_url"] == "https://newcorp.com/careers"
    assert data["raw_description"] == "Initial description"


def test_delete_job(client):
    create_res = client.post(
        "/api/jobs",
        json={"company": "Temp Corp", "title": "Contractor", "raw_description": "Temporary role"}
    )
    job_id = create_res.json()["id"]

    del_res = client.delete(f"/api/jobs/{job_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 404


def test_job_missing_company_validation(client):
    res = client.post(
        "/api/jobs",
        json={"title": "Engineer", "raw_description": "Description without company"}
    )
    assert res.status_code == 422


def test_job_empty_company_validation(client):
    res = client.post(
        "/api/jobs",
        json={"company": "   ", "title": "Engineer", "raw_description": "Description with empty company"}
    )
    assert res.status_code == 422


def test_job_empty_title_validation(client):
    res = client.post(
        "/api/jobs",
        json={"company": "Google", "title": "   ", "raw_description": "Description with empty title"}
    )
    assert res.status_code == 422


def test_job_empty_raw_description_validation(client):
    res = client.post(
        "/api/jobs",
        json={"company": "Google", "title": "SWE", "raw_description": "   "}
    )
    assert res.status_code == 422


def test_job_url_validation(client):
    # Invalid URL
    res_invalid = client.post(
        "/api/jobs",
        json={
            "company": "Amazon",
            "title": "SDE I",
            "raw_description": "Valid description",
            "source_url": "invalid-url-without-protocol",
        }
    )
    assert res_invalid.status_code == 422

    # Valid URL
    res_valid = client.post(
        "/api/jobs",
        json={
            "company": "Amazon",
            "title": "SDE I",
            "raw_description": "Valid description",
            "source_url": "https://amazon.jobs/en/jobs/123",
        }
    )
    assert res_valid.status_code == 201
    assert res_valid.json()["source_url"] == "https://amazon.jobs/en/jobs/123"
