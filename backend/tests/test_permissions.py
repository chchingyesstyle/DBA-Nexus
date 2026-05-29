from tests.conftest import auth_headers


def test_reader_cannot_access_secret_endpoint(client):
    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/databases/1/secret", headers=headers)
    assert r.status_code == 403


def test_reader_cannot_create_database(client):
    headers = auth_headers(client, "reader", "reader123")
    r = client.post("/api/databases", json={
        "name": "test-db", "engine": "PostgreSQL", "environment": "test"
    }, headers=headers)
    assert r.status_code == 403


def test_secret_reader_can_access_secret_endpoint(client, db):
    # Create a database first using admin
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/databases", json={
        "name": "secret-test-db",
        "engine": "PostgreSQL",
        "environment": "test",
        "admin_password": "supersecret",
    }, headers=admin_headers)
    assert r.status_code == 201
    db_id = r.json()["id"]

    secret_reader_headers = auth_headers(client, "secret_reader", "secret123")
    r = client.get(f"/api/databases/{db_id}/secret", headers=secret_reader_headers)
    assert r.status_code == 200
    assert r.json()["admin_password"] == "supersecret"


def test_no_token_returns_403(client):
    r = client.get("/api/databases")
    assert r.status_code == 403


def test_admin_can_manage_users(client):
    headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.get("/api/users", headers=headers)
    assert r.status_code == 200


def test_reader_cannot_manage_users(client):
    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/users", headers=headers)
    assert r.status_code == 403
