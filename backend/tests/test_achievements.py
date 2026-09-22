def test_create_achievement(client):
    response = client.post(
        "/api/achievements",
        json={
            "title": "Improved pipeline throughput by 50%",
            "description": "Refactored batch ingestion worker",
            "date": "2024-03-15",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Improved pipeline throughput by 50%"
    assert data["description"] == "Refactored batch ingestion worker"
    assert data["date"] == "2024-03-15"
    assert "id" in data


def test_get_achievement(client):
    create_res = client.post(
        "/api/achievements",
        json={"title": "Published benchmark study", "date": "2023-11-01"}
    )
    ach_id = create_res.json()["id"]

    res = client.get(f"/api/achievements/{ach_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "Published benchmark study"


def test_get_missing_achievement(client):
    res = client.get("/api/achievements/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_achievements(client):
    client.post("/api/achievements", json={"title": "Achievement A"})
    client.post("/api/achievements", json={"title": "Achievement B"})

    res = client.get("/api/achievements")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2


def test_update_achievement(client):
    create_res = client.post("/api/achievements", json={"title": "Original Title"})
    ach_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/achievements/{ach_id}",
        json={"title": "Updated Title", "description": "New description"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"
    assert update_res.json()["description"] == "New description"


def test_delete_achievement(client):
    create_res = client.post("/api/achievements", json={"title": "To Delete"})
    ach_id = create_res.json()["id"]

    del_res = client.delete(f"/api/achievements/{ach_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/achievements/{ach_id}")
    assert get_res.status_code == 404


def test_empty_achievement_title(client):
    res = client.post("/api/achievements", json={"title": "   "})
    assert res.status_code == 422
