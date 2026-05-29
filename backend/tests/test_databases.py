from tests.conftest import auth_headers


def test_admin_can_create_database(client):
    headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/databases", json={
        "name": "my-postgres",
        "engine": "PostgreSQL",
        "environment": "production",
        "hostname": "db.example.com",
        "port": 5432,
        "admin_username": "admin",
        "admin_password": "secret123",
    }, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "my-postgres"
    assert "admin_password" not in data


def test_list_databases(client):
    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/databases", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_list_databases_filter_environment(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    client.post("/api/databases", json={
        "name": "prod-db", "engine": "MySQL", "environment": "production"
    }, headers=admin_headers)
    client.post("/api/databases", json={
        "name": "dev-db", "engine": "MySQL", "environment": "development"
    }, headers=admin_headers)

    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/databases?environment=production", headers=headers)
    assert r.status_code == 200
    for db in r.json():
        assert db["environment"] == "production"


def test_secret_not_in_list_response(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    client.post("/api/databases", json={
        "name": "secure-db", "engine": "PostgreSQL", "environment": "production",
        "admin_password": "topsecret",
    }, headers=admin_headers)
    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/databases", headers=headers)
    for db in r.json():
        assert "admin_password" not in db
        assert "admin_password_encrypted" not in db


def test_update_database(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/databases", json={
        "name": "update-test-db", "engine": "PostgreSQL", "environment": "staging"
    }, headers=admin_headers)
    db_id = r.json()["id"]

    r = client.put(f"/api/databases/{db_id}", json={"environment": "production"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["environment"] == "production"


def test_delete_database(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/databases", json={
        "name": "to-delete", "engine": "PostgreSQL", "environment": "test"
    }, headers=admin_headers)
    db_id = r.json()["id"]

    r = client.delete(f"/api/databases/{db_id}", headers=admin_headers)
    assert r.status_code == 204
