from pydantic import BaseModel
from datetime import datetime


class DatabaseUserOut(BaseModel):
    id: int
    database_id: int
    username: str
    role_purpose: str | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class DatabaseUserCreate(BaseModel):
    username: str
    password: str | None = None
    role_purpose: str | None = None
    notes: str | None = None


class DatabaseUserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    role_purpose: str | None = None
    notes: str | None = None


class DatabaseUserSecretOut(BaseModel):
    password: str
