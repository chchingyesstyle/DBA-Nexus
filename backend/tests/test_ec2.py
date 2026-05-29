from tests.conftest import auth_headers


def test_admin_can_create_ec2(client):
    headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/ec2", json={
        "name": "web-server-01",
        "environment": "production",
        "instance_id": "i-0abc123",
        "private_ip": "10.0.0.1",
        "region": "ap-northeast-1",
        "ssh_username": "ec2-user",
        "ssh_private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----",
    }, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "web-server-01"
    assert "ssh_private_key" not in data
    assert "ssh_private_key_encrypted" not in data


def test_list_ec2(client):
    headers = auth_headers(client, "reader", "reader123")
    r = client.get("/api/ec2", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_reader_cannot_get_ec2_secret(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/ec2", json={
        "name": "secret-ec2", "environment": "production",
        "ssh_private_key": "MY_SECRET_KEY",
    }, headers=admin_headers)
    ec2_id = r.json()["id"]

    reader_headers = auth_headers(client, "reader", "reader123")
    r = client.get(f"/api/ec2/{ec2_id}/secret", headers=reader_headers)
    assert r.status_code == 403


def test_secret_reader_can_get_ec2_secret(client):
    admin_headers = auth_headers(client, "admin", "test-admin-pass")
    r = client.post("/api/ec2", json={
        "name": "secret-ec2-2", "environment": "production",
        "ssh_private_key": "MY_SSH_KEY",
    }, headers=admin_headers)
    ec2_id = r.json()["id"]

    secret_reader_headers = auth_headers(client, "secret_reader", "secret123")
    r = client.get(f"/api/ec2/{ec2_id}/secret", headers=secret_reader_headers)
    assert r.status_code == 200
    assert r.json()["ssh_private_key"] == "MY_SSH_KEY"
