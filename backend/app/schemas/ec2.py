from pydantic import BaseModel
from datetime import datetime
from app.schemas.application import ApplicationOut
from app.schemas.team import TeamOut


class EC2Out(BaseModel):
    id: int
    name: str
    instance_id: str | None = None
    environment: str
    private_ip: str | None = None
    hostname: str | None = None
    region: str | None = None
    account: str | None = None
    operating_system: str | None = None
    ssh_username: str | None = None
    description: str | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    applications: list[ApplicationOut] = []
    teams: list[TeamOut] = []

    model_config = {"from_attributes": True}


class EC2Create(BaseModel):
    name: str
    instance_id: str | None = None
    environment: str
    private_ip: str | None = None
    hostname: str | None = None
    region: str | None = None
    account: str | None = None
    operating_system: str | None = None
    ssh_username: str | None = None
    ssh_private_key: str | None = None
    description: str | None = None
    notes: str | None = None
    application_ids: list[int] = []
    team_ids: list[int] = []


class EC2Update(BaseModel):
    name: str | None = None
    instance_id: str | None = None
    environment: str | None = None
    private_ip: str | None = None
    hostname: str | None = None
    region: str | None = None
    account: str | None = None
    operating_system: str | None = None
    ssh_username: str | None = None
    ssh_private_key: str | None = None
    description: str | None = None
    notes: str | None = None
    application_ids: list[int] | None = None
    team_ids: list[int] | None = None


class EC2SecretOut(BaseModel):
    ssh_private_key: str
