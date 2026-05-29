from pydantic import BaseModel
from datetime import datetime
from app.schemas.application import ApplicationOut
from app.schemas.team import TeamOut


class DatabaseOut(BaseModel):
    id: int
    name: str
    engine: str
    environment: str
    hostname: str | None = None
    port: int | None = None
    region: str | None = None
    account: str | None = None
    rds_instance_id: str | None = None
    admin_username: str | None = None
    description: str | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    applications: list[ApplicationOut] = []
    teams: list[TeamOut] = []

    model_config = {"from_attributes": True}


class DatabaseCreate(BaseModel):
    name: str
    engine: str
    environment: str
    hostname: str | None = None
    port: int | None = None
    region: str | None = None
    account: str | None = None
    rds_instance_id: str | None = None
    admin_username: str | None = None
    admin_password: str | None = None
    description: str | None = None
    notes: str | None = None
    application_ids: list[int] = []
    team_ids: list[int] = []


class DatabaseUpdate(BaseModel):
    name: str | None = None
    engine: str | None = None
    environment: str | None = None
    hostname: str | None = None
    port: int | None = None
    region: str | None = None
    account: str | None = None
    rds_instance_id: str | None = None
    admin_username: str | None = None
    admin_password: str | None = None
    description: str | None = None
    notes: str | None = None
    application_ids: list[int] | None = None
    team_ids: list[int] | None = None


class DatabaseSecretOut(BaseModel):
    admin_password: str
