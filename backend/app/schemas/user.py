from pydantic import BaseModel
from app.schemas.role import RoleOut


class UserOut(BaseModel):
    id: int
    username: str
    is_active: bool
    role: RoleOut | None = None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str
    password: str
    role_id: int | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    role_id: int | None = None
    is_active: bool | None = None
