def test_create_technology(client):
    response = client.post(
        "/api/technologies",
        json={"name": "FastAPI", "description": "High performance web framework"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "FastAPI"
    assert data["description"] == "High performance web framework"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_get_technology(client):
    create_res = client.post("/api/technologies", json={"name": "Python"})
    tech_id = create_res.json()["id"]

    res = client.get(f"/api/technologies/{tech_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Python"


def test_get_missing_technology(client):
    res = client.get("/api/technologies/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_technologies(client):
    client.post("/api/technologies", json={"name": "Docker"})
    client.post("/api/technologies", json={"name": "PostgreSQL"})

    res = client.get("/api/technologies")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2
    names = [item["name"] for item in items]
    assert "Docker" in names
    assert "PostgreSQL" in names


def test_update_technology(client):
    create_res = client.post("/api/technologies", json={"name": "React"})
    tech_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/technologies/{tech_id}",
        json={"name": "React.js", "description": "UI library"}
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "React.js"
    assert data["description"] == "UI library"


def test_delete_technology(client):
    create_res = client.post("/api/technologies", json={"name": "To Delete"})
    tech_id = create_res.json()["id"]

    del_res = client.delete(f"/api/technologies/{tech_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/technologies/{tech_id}")
    assert get_res.status_code == 404


def test_duplicate_technology_name(client):
    client.post("/api/technologies", json={"name": "FastAPI"})
    dup_res = client.post("/api/technologies", json={"name": "FastAPI"})
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"].lower()


def test_empty_technology_name(client):
    res = client.post("/api/technologies", json={"name": "   "})
    assert res.status_code == 422
