from pydantic import BaseModel
from datetime import datetime


class ApplicationOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    owner_team: str | None = None
    notes: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ApplicationCreate(BaseModel):
    name: str
    description: str | None = None
    owner_team: str | None = None
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    owner_team: str | None = None
    notes: str | None = None
