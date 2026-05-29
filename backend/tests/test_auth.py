from tests.conftest import auth_headers


def test_login_success(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "test-admin-pass"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post("/api/auth/login", json={"username": "nobody", "password": "pass"})
    assert r.status_code == 401


def test_me_returns_current_user(client):
    headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "admin"
    assert data["role"]["name"] == "Super Admin"


def test_me_requires_auth(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 403
