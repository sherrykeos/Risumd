def test_create_project_basic(client):
    response = client.post(
        "/api/projects",
        json={
            "name": "FareLens",
            "description": "Flight pricing and prediction platform.",
            "role": "Backend Developer",
            "start_date": "2023-01-01",
            "end_date": "2023-06-01",
            "github_url": "https://github.com/user/farelens",
            "live_url": "https://farelens.dev",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "FareLens"
    assert data["role"] == "Backend Developer"
    assert data["github_url"] == "https://github.com/user/farelens"
    assert data["live_url"] == "https://farelens.dev"
    assert "id" in data


def test_get_project(client):
    create_res = client.post(
        "/api/projects",
        json={"name": "Portfolio"}
    )
    proj_id = create_res.json()["id"]

    res = client.get(f"/api/projects/{proj_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Portfolio"


def test_get_missing_project(client):
    res = client.get("/api/projects/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_projects(client):
    client.post("/api/projects", json={"name": "Proj 1"})
    client.post("/api/projects", json={"name": "Proj 2"})

    res = client.get("/api/projects")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2


def test_update_project(client):
    create_res = client.post("/api/projects", json={"name": "Initial Name"})
    proj_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/projects/{proj_id}",
        json={"name": "Updated Name", "role": "Tech Lead"}
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Updated Name"
    assert data["role"] == "Tech Lead"


def test_delete_project(client):
    create_res = client.post("/api/projects", json={"name": "To Delete"})
    proj_id = create_res.json()["id"]

    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/projects/{proj_id}")
    assert get_res.status_code == 404


def test_invalid_project_empty_name(client):
    res = client.post("/api/projects", json={"name": "   "})
    assert res.status_code == 422


def test_invalid_project_dates(client):
    res = client.post(
        "/api/projects",
        json={
            "name": "Invalid Dates",
            "start_date": "2024-05-01",
            "end_date": "2024-01-01",
        }
    )
    assert res.status_code == 422


def test_invalid_project_url(client):
    res = client.post(
        "/api/projects",
        json={
            "name": "Invalid URL",
            "github_url": "ftp://not-a-valid-http-url",
        }
    )
    assert res.status_code == 422
