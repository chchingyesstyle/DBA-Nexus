from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Database
from app.models.database_user import DatabaseUser
from app.schemas.database_user import DatabaseUserOut, DatabaseUserCreate, DatabaseUserUpdate, DatabaseUserSecretOut
from app.core.security import encrypt_secret, decrypt_secret
from app.core.deps import require_permission

router = APIRouter(prefix="/databases/{db_id}/users", tags=["database-users"])
_read = require_permission("can_read_inventory")
_write = require_permission("can_write_inventory")
_secrets = require_permission("can_view_secrets")


def _get_db_or_404(db_id: int, db: Session) -> Database:
    record = db.query(Database).filter_by(id=db_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Database not found")
    return record


@router.get("", response_model=list[DatabaseUserOut])
def list_db_users(db_id: int, db: Session = Depends(get_db), _=Depends(_read)):
    _get_db_or_404(db_id, db)
    return db.query(DatabaseUser).filter_by(database_id=db_id).all()


@router.post("", response_model=DatabaseUserOut, status_code=status.HTTP_201_CREATED)
def create_db_user(db_id: int, body: DatabaseUserCreate, db: Session = Depends(get_db), _=Depends(_write)):
    _get_db_or_404(db_id, db)
    user = DatabaseUser(
        database_id=db_id,
        username=body.username,
        role_purpose=body.role_purpose,
        notes=body.notes,
    )
    if body.password:
        user.password_encrypted = encrypt_secret(body.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=DatabaseUserOut)
def get_db_user(db_id: int, user_id: int, db: Session = Depends(get_db), _=Depends(_read)):
    user = db.query(DatabaseUser).filter_by(id=user_id, database_id=db_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Database user not found")
    return user


@router.put("/{user_id}", response_model=DatabaseUserOut)
def update_db_user(db_id: int, user_id: int, body: DatabaseUserUpdate, db: Session = Depends(get_db), _=Depends(_write)):
    user = db.query(DatabaseUser).filter_by(id=user_id, database_id=db_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Database user not found")
    if body.username is not None:
        user.username = body.username
    if body.password is not None:
        user.password_encrypted = encrypt_secret(body.password)
    if body.role_purpose is not None:
        user.role_purpose = body.role_purpose
    if body.notes is not None:
        user.notes = body.notes
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_db_user(db_id: int, user_id: int, db: Session = Depends(get_db), _=Depends(_write)):
    user = db.query(DatabaseUser).filter_by(id=user_id, database_id=db_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Database user not found")
    db.delete(user)
    db.commit()


@router.get("/{user_id}/secret", response_model=DatabaseUserSecretOut)
def get_db_user_secret(db_id: int, user_id: int, db: Session = Depends(get_db), _=Depends(_secrets)):
    user = db.query(DatabaseUser).filter_by(id=user_id, database_id=db_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Database user not found")
    return DatabaseUserSecretOut(password=decrypt_secret(user.password_encrypted or ""))
