def test_create_experience_basic(client):
    response = client.post(
        "/api/experience",
        json={
            "company": "Tech Innovations Inc.",
            "role": "Senior Software Engineer",
            "description": "Led backend services development",
            "start_date": "2021-03-01",
            "end_date": "2023-08-31",
            "location": "New York, NY",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["company"] == "Tech Innovations Inc."
    assert data["role"] == "Senior Software Engineer"
    assert data["location"] == "New York, NY"
    assert "id" in data


def test_get_experience(client):
    create_res = client.post(
        "/api/experience",
        json={"company": "Startup Co", "role": "Full Stack Engineer"}
    )
    exp_id = create_res.json()["id"]

    res = client.get(f"/api/experience/{exp_id}")
    assert res.status_code == 200
    assert res.json()["company"] == "Startup Co"


def test_get_missing_experience(client):
    res = client.get("/api/experience/99999")
    assert res.status_code == 404


def test_list_experience(client):
    client.post("/api/experience", json={"company": "Company A", "role": "Role A"})
    client.post("/api/experience", json={"company": "Company B", "role": "Role B"})

    res = client.get("/api/experience")
    assert res.status_code == 200
    assert len(res.json()) >= 2


def test_update_experience(client):
    create_res = client.post(
        "/api/experience",
        json={"company": "Old Corp", "role": "Junior Dev"}
    )
    exp_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/experience/{exp_id}",
        json={"role": "Mid-Level Dev", "location": "Remote"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "Mid-Level Dev"
    assert update_res.json()["location"] == "Remote"


def test_delete_experience(client):
    create_res = client.post(
        "/api/experience",
        json={"company": "Temp Corp", "role": "Contractor"}
    )
    exp_id = create_res.json()["id"]

    del_res = client.delete(f"/api/experience/{exp_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/experience/{exp_id}")
    assert get_res.status_code == 404


def test_invalid_experience_dates(client):
    res = client.post(
        "/api/experience",
        json={
            "company": "Bad Dates Inc",
            "role": "Engineer",
            "start_date": "2024-01-01",
            "end_date": "2022-01-01",
        }
    )
    assert res.status_code == 422


def test_empty_experience_company(client):
    res = client.post(
        "/api/experience",
        json={"company": "   ", "role": "Engineer"}
    )
    assert res.status_code == 422
