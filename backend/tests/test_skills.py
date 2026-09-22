def test_create_skill(client):
    response = client.post(
        "/api/skills",
        json={
            "name": "Backend Development",
            "category": "Engineering",
            "description": "Server-side architecture and logic",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Backend Development"
    assert data["category"] == "Engineering"
    assert data["description"] == "Server-side architecture and logic"
    assert "id" in data


def test_get_skill(client):
    create_res = client.post("/api/skills", json={"name": "Machine Learning"})
    skill_id = create_res.json()["id"]

    res = client.get(f"/api/skills/{skill_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Machine Learning"


def test_get_missing_skill(client):
    res = client.get("/api/skills/99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_skills_and_category_filter(client):
    client.post("/api/skills", json={"name": "Python", "category": "Languages"})
    client.post("/api/skills", json={"name": "Go", "category": "Languages"})
    client.post("/api/skills", json={"name": "Docker", "category": "DevOps"})

    res_all = client.get("/api/skills")
    assert res_all.status_code == 200
    assert len(res_all.json()) >= 3

    res_filtered = client.get("/api/skills?category=Languages")
    assert res_filtered.status_code == 200
    items = res_filtered.json()
    assert len(items) == 2
    for item in items:
        assert item["category"] == "Languages"


def test_update_skill(client):
    create_res = client.post("/api/skills", json={"name": "System Design"})
    skill_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/skills/{skill_id}",
        json={"name": "Distributed Systems", "category": "Architecture"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Distributed Systems"
    assert update_res.json()["category"] == "Architecture"


def test_delete_skill(client):
    create_res = client.post("/api/skills", json={"name": "Old Skill"})
    skill_id = create_res.json()["id"]

    del_res = client.delete(f"/api/skills/{skill_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/skills/{skill_id}")
    assert get_res.status_code == 404


def test_duplicate_skill_name(client):
    client.post("/api/skills", json={"name": "Kubernetes"})
    dup_res = client.post("/api/skills", json={"name": "Kubernetes"})
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"].lower()


def test_empty_skill_name(client):
    res = client.post("/api/skills", json={"name": ""})
    assert res.status_code == 422
