from sqlalchemy import Table, Column, Integer, ForeignKey
from app.db.base import Base

role_permissions = Table(
    "role_permissions", Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

database_applications = Table(
    "database_applications", Base.metadata,
    Column("database_id", Integer, ForeignKey("databases.id", ondelete="CASCADE"), primary_key=True),
    Column("application_id", Integer, ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
)

database_teams = Table(
    "database_teams", Base.metadata,
    Column("database_id", Integer, ForeignKey("databases.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
)

ec2_applications = Table(
    "ec2_applications", Base.metadata,
    Column("ec2_id", Integer, ForeignKey("ec2_servers.id", ondelete="CASCADE"), primary_key=True),
    Column("application_id", Integer, ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
)

ec2_teams = Table(
    "ec2_teams", Base.metadata,
    Column("ec2_id", Integer, ForeignKey("ec2_servers.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
)
