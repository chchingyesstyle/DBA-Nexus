import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.session import get_db
from app.main import app
import app.models  # noqa: F401

TEST_DB_URL = "postgresql://postgres:postgres@localhost:5432/dba_nexus_test"

engine = create_engine(TEST_DB_URL)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    _seed_test_data()
    yield
    Base.metadata.drop_all(bind=engine)


def _seed_test_data():
    from app.models.permission import Permission
    from app.models.role import Role
    from app.models.user import User
    from app.core.security import hash_password

    db = TestingSession()
    try:
        perms = {
            name: Permission(name=name)
            for name in ["can_read_inventory", "can_write_inventory", "can_view_secrets", "can_manage_users"]
        }
        for p in perms.values():
            if not db.query(Permission).filter_by(name=p.name).first():
                db.add(p)
        db.flush()

        role_defs = {
            "Super Admin": list(perms.values()),
            "Writer": [perms["can_read_inventory"], perms["can_write_inventory"]],
            "Reader": [perms["can_read_inventory"]],
            "Secret Reader": [perms["can_read_inventory"], perms["can_view_secrets"]],
        }
        roles = {}
        for name, role_perms in role_defs.items():
            role = db.query(Role).filter_by(name=name).first()
            if not role:
                role = Role(name=name, permissions=role_perms)
                db.add(role)
                db.flush()
            roles[name] = role

        users = [
            ("admin", "test-admin-pass", roles["Super Admin"]),
            ("writer", "writer123", roles["Writer"]),
            ("reader", "reader123", roles["Reader"]),
            ("secret_reader", "secret123", roles["Secret Reader"]),
        ]
        for username, password, role in users:
            if not db.query(User).filter_by(username=username).first():
                db.add(User(username=username, hashed_password=hash_password(password), role=role))
        db.commit()
    finally:
        db.close()


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override():
        yield db
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def get_token(client: TestClient, username: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    return r.json()["access_token"]


def auth_headers(client: TestClient, username: str, password: str) -> dict:
    return {"Authorization": f"Bearer {get_token(client, username, password)}"}
