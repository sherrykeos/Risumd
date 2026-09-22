def test_create_education(client):
    response = client.post(
        "/api/education",
        json={
            "institution": "MIT",
            "degree": "B.S.",
            "field": "Computer Science",
            "start_date": "2018-09-01",
            "end_date": "2022-06-01",
            "grade": "3.9 GPA",
            "description": "Graduated with honors",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["institution"] == "MIT"
    assert data["degree"] == "B.S."
    assert data["field"] == "Computer Science"
    assert data["start_date"] == "2018-09-01"
    assert data["end_date"] == "2022-06-01"
    assert "id" in data


def test_get_education(client):
    create_res = client.post(
        "/api/education",
        json={"institution": "Stanford", "degree": "M.S.", "field": "AI"}
    )
    edu_id = create_res.json()["id"]

    res = client.get(f"/api/education/{edu_id}")
    assert res.status_code == 200
    assert res.json()["institution"] == "Stanford"


def test_get_missing_education(client):
    res = client.get("/api/education/99999")
    assert res.status_code == 404


def test_list_education(client):
    client.post("/api/education", json={"institution": "Univ A", "degree": "B.A."})
    client.post("/api/education", json={"institution": "Univ B", "degree": "M.A."})

    res = client.get("/api/education")
    assert res.status_code == 200
    assert len(res.json()) >= 2


def test_update_education(client):
    create_res = client.post(
        "/api/education",
        json={"institution": "Oxford", "degree": "B.A."}
    )
    edu_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/education/{edu_id}",
        json={"grade": "First Class"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["grade"] == "First Class"


def test_delete_education(client):
    create_res = client.post(
        "/api/education",
        json={"institution": "Temp Univ", "degree": "Diploma"}
    )
    edu_id = create_res.json()["id"]

    del_res = client.delete(f"/api/education/{edu_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/education/{edu_id}")
    assert get_res.status_code == 404


def test_education_end_date_before_start_date(client):
    res = client.post(
        "/api/education",
        json={
            "institution": "Invalid Univ",
            "degree": "B.S.",
            "start_date": "2022-09-01",
            "end_date": "2020-06-01",  # invalid
        }
    )
    assert res.status_code == 422


def test_empty_education_institution(client):
    res = client.post(
        "/api/education",
        json={"institution": "   ", "degree": "B.S."}
    )
    assert res.status_code == 422
