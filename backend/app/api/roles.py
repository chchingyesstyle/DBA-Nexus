from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.role import Role
from app.models.permission import Permission
from app.schemas.role import RoleOut, RoleCreate, RoleUpdate, PermissionOut
from app.core.deps import require_permission

router = APIRouter(prefix="/roles", tags=["roles"])
_admin = require_permission("can_manage_users")


@router.get("/permissions", response_model=list[PermissionOut])
def list_permissions(db: Session = Depends(get_db), _=Depends(_admin)):
    return db.query(Permission).all()


@router.get("", response_model=list[RoleOut])
def list_roles(db: Session = Depends(get_db), _=Depends(_admin)):
    return db.query(Role).all()


@router.post("", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(body: RoleCreate, db: Session = Depends(get_db), _=Depends(_admin)):
    role = Role(name=body.name, description=body.description)
    if body.permission_ids:
        role.permissions = db.query(Permission).filter(Permission.id.in_(body.permission_ids)).all()
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, body: RoleUpdate, db: Session = Depends(get_db), _=Depends(_admin)):
    role = db.query(Role).filter_by(id=role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if body.name is not None:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    if body.permission_ids is not None:
        role.permissions = db.query(Permission).filter(Permission.id.in_(body.permission_ids)).all()
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db), _=Depends(_admin)):
    role = db.query(Role).filter_by(id=role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
