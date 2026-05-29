"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-29
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.String(255)),
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.String(255)),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer(), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("owner_team", sa.String(200)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("contact", sa.String(200)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "databases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("engine", sa.String(100), nullable=False),
        sa.Column("environment", sa.String(50), nullable=False),
        sa.Column("hostname", sa.String(255)),
        sa.Column("port", sa.Integer()),
        sa.Column("region", sa.String(100)),
        sa.Column("account", sa.String(200)),
        sa.Column("rds_instance_id", sa.String(200)),
        sa.Column("admin_username", sa.String(200)),
        sa.Column("admin_password_encrypted", sa.Text()),
        sa.Column("description", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "database_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("database_id", sa.Integer(), sa.ForeignKey("databases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("username", sa.String(200), nullable=False),
        sa.Column("password_encrypted", sa.Text()),
        sa.Column("role_purpose", sa.String(200)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "database_applications",
        sa.Column("database_id", sa.Integer(), sa.ForeignKey("databases.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "database_teams",
        sa.Column("database_id", sa.Integer(), sa.ForeignKey("databases.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "ec2_servers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("instance_id", sa.String(200)),
        sa.Column("environment", sa.String(50), nullable=False),
        sa.Column("private_ip", sa.String(50)),
        sa.Column("hostname", sa.String(255)),
        sa.Column("region", sa.String(100)),
        sa.Column("account", sa.String(200)),
        sa.Column("operating_system", sa.String(200)),
        sa.Column("ssh_username", sa.String(200)),
        sa.Column("ssh_private_key_encrypted", sa.Text()),
        sa.Column("description", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        "ec2_applications",
        sa.Column("ec2_id", sa.Integer(), sa.ForeignKey("ec2_servers.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "ec2_teams",
        sa.Column("ec2_id", sa.Integer(), sa.ForeignKey("ec2_servers.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("ec2_teams")
    op.drop_table("ec2_applications")
    op.drop_table("ec2_servers")
    op.drop_table("database_teams")
    op.drop_table("database_applications")
    op.drop_table("database_users")
    op.drop_table("databases")
    op.drop_table("teams")
    op.drop_table("applications")
    op.drop_table("users")
    op.drop_table("role_permissions")
    op.drop_table("roles")
    op.drop_table("permissions")
