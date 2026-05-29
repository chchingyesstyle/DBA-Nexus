from pydantic import BaseModel
from datetime import datetime


class TeamOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    contact: str | None = None
    notes: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TeamCreate(BaseModel):
    name: str
    description: str | None = None
    contact: str | None = None
    notes: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    contact: str | None = None
    notes: str | None = None
