"""Idempotent seed: creates permissions, roles, and the default admin user."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings

PERMISSIONS = [
    ("can_read_inventory", "View all inventory records"),
    ("can_write_inventory", "Create, update, and delete inventory records"),
    ("can_view_secrets", "Reveal passwords and SSH private keys"),
    ("can_manage_users", "Manage users and role assignments"),
]

ROLES = {
    "Super Admin": {
        "description": "Full access to everything",
        "permissions": ["can_read_inventory", "can_write_inventory", "can_view_secrets", "can_manage_users"],
    },
    "Writer": {
        "description": "Can create and update inventory records",
        "permissions": ["can_read_inventory", "can_write_inventory"],
    },
    "Reader": {
        "description": "Read-only access to inventory",
        "permissions": ["can_read_inventory"],
    },
    "Secret Reader": {
        "description": "Can view inventory and reveal secrets",
        "permissions": ["can_read_inventory", "can_view_secrets"],
    },
}


def seed():
    db = SessionLocal()
    try:
        # Upsert permissions
        perm_map: dict[str, Permission] = {}
        for name, description in PERMISSIONS:
            perm = db.query(Permission).filter_by(name=name).first()
            if not perm:
                perm = Permission(name=name, description=description)
                db.add(perm)
                db.flush()
            perm_map[name] = perm

        # Upsert roles
        for role_name, role_data in ROLES.items():
            role = db.query(Role).filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name, description=role_data["description"])
                db.add(role)
                db.flush()
            role.permissions = [perm_map[p] for p in role_data["permissions"]]

        # Upsert admin user
        admin_role = db.query(Role).filter_by(name="Super Admin").first()
        admin = db.query(User).filter_by(username=settings.initial_admin_username).first()
        if not admin:
            admin = User(
                username=settings.initial_admin_username,
                hashed_password=hash_password(settings.initial_admin_password),
                is_active=True,
                role=admin_role,
            )
            db.add(admin)
            print(f"Created admin user: {settings.initial_admin_username}")
        else:
            print(f"Admin user already exists: {settings.initial_admin_username}")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
