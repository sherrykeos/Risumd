def test_project_associations_creation_and_resolution(client):
    # Pre-create a skill and a technology
    skill_res = client.post("/api/skills", json={"name": "System Architecture"})
    skill_id = skill_res.json()["id"]

    tech_res = client.post("/api/technologies", json={"name": "PostgreSQL"})
    tech_id = tech_res.json()["id"]

    # Pre-create an achievement
    ach_res = client.post("/api/achievements", json={"title": "Pre-existing Achievement"})
    existing_ach_id = ach_res.json()["id"]

    # Create project associating existing by ID / name, and new by name / inline object
    project_payload = {
        "name": "Distributed Analytics Platform",
        "description": "High performance event processing platform",
        "role": "Architect",
        "technologies": ["PostgreSQL", "FastAPI", "Redis"],  # "PostgreSQL" exists; "FastAPI" and "Redis" are new
        "skills": ["System Architecture", "Cloud Native"],    # "System Architecture" exists; "Cloud Native" is new
        "achievements": [
            existing_ach_id,  # Link existing ID
            {
                "title": "Inline Achievement: Processed 10M events/day",
                "description": "Optimized event queue throughput",
                "date": "2023-09-01",
            },
        ],
        "github_url": "https://github.com/test/analytics",
    }

    create_res = client.post("/api/projects", json=project_payload)
    assert create_res.status_code == 201
    data = create_res.json()

    # Verify technologies
    tech_names = [t["name"] for t in data["technologies"]]
    assert "PostgreSQL" in tech_names
    assert "FastAPI" in tech_names
    assert "Redis" in tech_names
    # Check that PostgreSQL reused the existing ID
    for t in data["technologies"]:
        if t["name"] == "PostgreSQL":
            assert t["id"] == tech_id

    # Verify skills
    skill_names = [s["name"] for s in data["skills"]]
    assert "System Architecture" in skill_names
    assert "Cloud Native" in skill_names
    for s in data["skills"]:
        if s["name"] == "System Architecture":
            assert s["id"] == skill_id

    # Verify achievements
    ach_titles = [a["title"] for a in data["achievements"]]
    assert "Pre-existing Achievement" in ach_titles
    assert "Inline Achievement: Processed 10M events/day" in ach_titles

    # Verify GET returns all relationships
    get_res = client.get(f"/api/projects/{data['id']}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert len(get_data["technologies"]) == 3
    assert len(get_data["skills"]) == 2
    assert len(get_data["achievements"]) == 2


def test_experience_associations_creation_and_resolution(client):
    # Create an experience with technologies, skills, and inline achievements
    exp_payload = {
        "company": "CloudCorp",
        "role": "Principal Engineer",
        "description": "Led platform infrastructure",
        "technologies": ["Kubernetes", "Go", "Docker"],
        "skills": ["DevOps", "Infrastructure"],
        "achievements": [
            {
                "title": "Migrated cluster infrastructure",
                "description": "99.99% uptime maintained during migration",
                "date": "2023-05-15",
            }
        ],
    }

    create_res = client.post("/api/experience", json=exp_payload)
    assert create_res.status_code == 201
    data = create_res.json()

    assert len(data["technologies"]) == 3
    assert len(data["skills"]) == 2
    assert len(data["achievements"]) == 1

    # Verify GET
    get_res = client.get(f"/api/experience/{data['id']}")
    assert get_res.status_code == 200
    assert len(get_res.json()["technologies"]) == 3


def test_reusability_across_project_and_experience(client):
    # Both a project and an experience share the same technology and skill
    client.post(
        "/api/projects",
        json={
            "name": "Project Alpha",
            "technologies": ["Python"],
            "skills": ["Backend Development"],
        }
    )

    client.post(
        "/api/experience",
        json={
            "company": "Company Beta",
            "role": "Backend Engineer",
            "technologies": ["Python"],
            "skills": ["Backend Development"],
        }
    )

    # Verify there is only ONE technology named "Python" and ONE skill named "Backend Development"
    tech_res = client.get("/api/technologies")
    matching_techs = [t for t in tech_res.json() if t["name"] == "Python"]
    assert len(matching_techs) == 1

    skill_res = client.get("/api/skills")
    matching_skills = [s for s in skill_res.json() if s["name"] == "Backend Development"]
    assert len(matching_skills) == 1


def test_delete_project_preserves_associated_entities(client):
    # Deleting a project should NOT delete the associated technologies, skills, or achievements
    create_res = client.post(
        "/api/projects",
        json={
            "name": "Project to Delete",
            "technologies": ["Rust"],
            "skills": ["Systems Programming"],
            "achievements": [{"title": "Built microsecond parser"}],
        }
    )
    proj = create_res.json()
    proj_id = proj["id"]
    tech_id = proj["technologies"][0]["id"]
    skill_id = proj["skills"][0]["id"]
    ach_id = proj["achievements"][0]["id"]

    # Delete project
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204

    # Verify project is gone
    assert client.get(f"/api/projects/{proj_id}").status_code == 404

    # Verify associated entities STILL EXIST
    assert client.get(f"/api/technologies/{tech_id}").status_code == 200
    assert client.get(f"/api/skills/{skill_id}").status_code == 200
    assert client.get(f"/api/achievements/{ach_id}").status_code == 200


def test_delete_experience_preserves_associated_entities(client):
    create_res = client.post(
        "/api/experience",
        json={
            "company": "Exp to Delete",
            "role": "Consultant",
            "technologies": ["GraphQL"],
            "skills": ["API Design"],
            "achievements": [{"title": "Architected GraphQL schema"}],
        }
    )
    exp = create_res.json()
    exp_id = exp["id"]
    tech_id = exp["technologies"][0]["id"]
    skill_id = exp["skills"][0]["id"]
    ach_id = exp["achievements"][0]["id"]

    # Delete experience
    assert client.delete(f"/api/experience/{exp_id}").status_code == 204
    assert client.get(f"/api/experience/{exp_id}").status_code == 404

    # Verify entities persist
    assert client.get(f"/api/technologies/{tech_id}").status_code == 200
    assert client.get(f"/api/skills/{skill_id}").status_code == 200
    assert client.get(f"/api/achievements/{ach_id}").status_code == 200
