def test_create_and_retrieve_analysis(client):
    # 1. Create a job
    job_res = client.post(
        "/api/jobs",
        json={
            "company": "Netflix",
            "title": "Senior Systems Engineer",
            "raw_description": "We need a backend engineer proficient in Java, Spring Boot, microservices, and Docker.",
        }
    )
    job_id = job_res.json()["id"]

    # 2. Create analysis
    analysis_payload = {
        "seniority": "Senior",
        "domain": "Systems & Streaming Infrastructure",
        "required_skills": ["Java", "Spring Boot", "Distributed Systems"],
        "preferred_skills": ["Docker", "Kubernetes"],
        "technologies": ["PostgreSQL", "Kafka", "Redis"],
        "responsibilities": ["Architect streaming telemetry", "Optimize microservice latency"],
        "keywords": ["streaming", "microservices", "telemetry"],
        "summary": "Core systems engineering role for global video streaming infrastructure.",
    }
    analysis_res = client.post(f"/api/jobs/{job_id}/analysis", json=analysis_payload)
    assert analysis_res.status_code == 201
    data = analysis_res.json()
    assert data["job_id"] == job_id
    assert data["seniority"] == "Senior"
    assert data["domain"] == "Systems & Streaming Infrastructure"
    assert data["required_skills"] == ["Java", "Spring Boot", "Distributed Systems"]
    assert data["preferred_skills"] == ["Docker", "Kubernetes"]
    assert data["technologies"] == ["PostgreSQL", "Kafka", "Redis"]
    assert data["responsibilities"] == ["Architect streaming telemetry", "Optimize microservice latency"]
    assert data["keywords"] == ["streaming", "microservices", "telemetry"]
    assert data["summary"] == "Core systems engineering role for global video streaming infrastructure."
    assert "id" in data
    assert "created_at" in data

    # 3. Retrieve analysis via GET /api/jobs/{id}/analysis
    get_res = client.get(f"/api/jobs/{job_id}/analysis")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == data["id"]
    assert get_res.json()["required_skills"] == ["Java", "Spring Boot", "Distributed Systems"]


def test_job_response_includes_nested_analysis(client):
    # Create job
    job_res = client.post(
        "/api/jobs",
        json={"company": "Meta", "title": "Software Engineer", "raw_description": "Build high-scale systems."}
    )
    job_id = job_res.json()["id"]

    # Before analysis, analysis field is None
    get_before = client.get(f"/api/jobs/{job_id}").json()
    assert get_before["analysis"] is None

    # Create analysis
    client.post(
        f"/api/jobs/{job_id}/analysis",
        json={
            "seniority": "Mid",
            "domain": "Infrastructure",
            "required_skills": ["C++", "Python"],
            "technologies": ["PostgreSQL"],
        }
    )

    # After analysis, GET /api/jobs/{id} includes analysis
    get_after = client.get(f"/api/jobs/{job_id}").json()
    assert get_after["analysis"] is not None
    assert get_after["analysis"]["job_id"] == job_id
    assert get_after["analysis"]["required_skills"] == ["C++", "Python"]

    # Also list endpoint includes analysis
    list_jobs = client.get("/api/jobs").json()
    matching = [j for j in list_jobs if j["id"] == job_id][0]
    assert matching["analysis"] is not None
    assert matching["analysis"]["domain"] == "Infrastructure"


def test_get_analysis_missing_job_404(client):
    res = client.get("/api/jobs/99999/analysis")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_get_analysis_when_no_analysis_exists_404(client):
    job_res = client.post(
        "/api/jobs",
        json={"company": "Uber", "title": "Backend Dev", "raw_description": "Driver dispatch platform."}
    )
    job_id = job_res.json()["id"]

    res = client.get(f"/api/jobs/{job_id}/analysis")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_prevent_duplicate_analysis_409(client):
    job_res = client.post(
        "/api/jobs",
        json={"company": "Apple", "title": "Platform Engineer", "raw_description": "Platform services."}
    )
    job_id = job_res.json()["id"]

    # First analysis succeeds
    res1 = client.post(
        f"/api/jobs/{job_id}/analysis",
        json={"seniority": "Staff", "domain": "Cloud", "required_skills": ["Go"]}
    )
    assert res1.status_code == 201

    # Second analysis fails with 409 Conflict
    res2 = client.post(
        f"/api/jobs/{job_id}/analysis",
        json={"seniority": "Principal", "domain": "Cloud", "required_skills": ["Rust"]}
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_update_analysis(client):
    job_res = client.post(
        "/api/jobs",
        json={"company": "GitHub", "title": "Engineer", "raw_description": "Git ecosystem."}
    )
    job_id = job_res.json()["id"]

    client.post(
        f"/api/jobs/{job_id}/analysis",
        json={
            "seniority": "Mid",
            "domain": "DevTools",
            "required_skills": ["Ruby", "Go"],
            "technologies": ["MySQL"],
        }
    )

    update_res = client.patch(
        f"/api/jobs/{job_id}/analysis",
        json={
            "seniority": "Senior",
            "required_skills": ["Ruby", "Go", "TypeScript"],
            "technologies": ["MySQL", "PostgreSQL"],
            "summary": "Updated summary for GitHub role.",
        }
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["seniority"] == "Senior"
    assert data["domain"] == "DevTools"  # preserved
    assert data["required_skills"] == ["Ruby", "Go", "TypeScript"]
    assert data["technologies"] == ["MySQL", "PostgreSQL"]
    assert data["summary"] == "Updated summary for GitHub role."


def test_delete_analysis_preserves_job(client):
    job_res = client.post(
        "/api/jobs",
        json={"company": "Shopify", "title": "Commerce Dev", "raw_description": "Checkout systems."}
    )
    job_id = job_res.json()["id"]

    client.post(
        f"/api/jobs/{job_id}/analysis",
        json={"seniority": "Lead", "required_skills": ["Ruby"]}
    )

    # Delete analysis
    del_res = client.delete(f"/api/jobs/{job_id}/analysis")
    assert del_res.status_code == 204

    # Verify analysis is gone (404)
    assert client.get(f"/api/jobs/{job_id}/analysis").status_code == 404

    # Verify parent job STILL EXISTS
    job_check = client.get(f"/api/jobs/{job_id}")
    assert job_check.status_code == 200
    assert job_check.json()["analysis"] is None


def test_delete_job_cascades_to_analysis(client):
    job_res = client.post(
        "/api/jobs",
        json={"company": "Temp Inc", "title": "Dev", "raw_description": "To be deleted."}
    )
    job_id = job_res.json()["id"]

    client.post(
        f"/api/jobs/{job_id}/analysis",
        json={"seniority": "Junior", "required_skills": ["Python"]}
    )

    # Delete Job
    del_res = client.delete(f"/api/jobs/{job_id}")
    assert del_res.status_code == 204

    # Verify Job is gone
    assert client.get(f"/api/jobs/{job_id}").status_code == 404

    # Verify Analysis is also gone (cascade deleted)
    assert client.get(f"/api/jobs/{job_id}/analysis").status_code == 404


def test_jsonb_arrays_persisted_and_returned(client):
    # Test complex and empty JSONB arrays
    job_res = client.post(
        "/api/jobs",
        json={"company": "Spotify", "title": "Data Engineer", "raw_description": "Data processing."}
    )
    job_id = job_res.json()["id"]

    payload = {
        "seniority": "Senior",
        "domain": "Big Data",
        "required_skills": ["Apache Spark", "Scala", "SQL", "Distributed Computing"],
        "preferred_skills": ["Airflow", "GCP", "BigQuery"],
        "technologies": ["Kafka", "Hadoop", "PostgreSQL", "dbt"],
        "responsibilities": ["Build ETL pipelines", "Ensure data quality", "Optimize query latency"],
        "keywords": ["ETL", "Spark", "DataLake", "Streaming"],
        "summary": "Building scalable big data pipelines for recommendation systems.",
    }

    create_res = client.post(f"/api/jobs/{job_id}/analysis", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()

    assert data["required_skills"] == payload["required_skills"]
    assert data["preferred_skills"] == payload["preferred_skills"]
    assert data["technologies"] == payload["technologies"]
    assert data["responsibilities"] == payload["responsibilities"]
    assert data["keywords"] == payload["keywords"]
