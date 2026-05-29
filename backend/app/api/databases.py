from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Database
from app.models.application import Application
from app.models.team import Team
from app.schemas.database import DatabaseOut, DatabaseCreate, DatabaseUpdate, DatabaseSecretOut
from app.core.security import encrypt_secret, decrypt_secret
from app.core.deps import get_current_user, require_permission

router = APIRouter(prefix="/databases", tags=["databases"])
_read = require_permission("can_read_inventory")
_write = require_permission("can_write_inventory")
_secrets = require_permission("can_view_secrets")


def _apply_links(db: Session, record: Database, application_ids: list[int], team_ids: list[int]):
    record.applications = db.query(Application).filter(Application.id.in_(application_ids)).all()
    record.teams = db.query(Team).filter(Team.id.in_(team_ids)).all()


@router.get("", response_model=list[DatabaseOut])
def list_databases(
    search: str | None = None,
    environment: str | None = None,
    application_id: int | None = None,
    team_id: int | None = None,
    db: Session = Depends(get_db),
    _=Depends(_read),
):
    q = db.query(Database)
    if search:
        q = q.filter(Database.name.ilike(f"%{search}%"))
    if environment:
        q = q.filter(Database.environment == environment)
    if application_id:
        q = q.filter(Database.applications.any(Application.id == application_id))
    if team_id:
        q = q.filter(Database.teams.any(Team.id == team_id))
    return q.order_by(Database.name).all()


@router.post("", response_model=DatabaseOut, status_code=status.HTTP_201_CREATED)
def create_database(body: DatabaseCreate, db: Session = Depends(get_db), _=Depends(_write)):
    data = body.model_dump(exclude={"admin_password", "application_ids", "team_ids"})
    record = Database(**data)
    if body.admin_password:
        record.admin_password_encrypted = encrypt_secret(body.admin_password)
    _apply_links(db, record, body.application_ids, body.team_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{db_id}", response_model=DatabaseOut)
def get_database(db_id: int, db: Session = Depends(get_db), _=Depends(_read)):
    record = db.query(Database).filter_by(id=db_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Database not found")
    return record


@router.put("/{db_id}", response_model=DatabaseOut)
def update_database(db_id: int, body: DatabaseUpdate, db: Session = Depends(get_db), _=Depends(_write)):
    record = db.query(Database).filter_by(id=db_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Database not found")
    data = body.model_dump(exclude_unset=True, exclude={"admin_password", "application_ids", "team_ids"})
    for field, value in data.items():
        setattr(record, field, value)
    if body.admin_password is not None:
        record.admin_password_encrypted = encrypt_secret(body.admin_password)
    if body.application_ids is not None:
        record.applications = db.query(Application).filter(Application.id.in_(body.application_ids)).all()
    if body.team_ids is not None:
        record.teams = db.query(Team).filter(Team.id.in_(body.team_ids)).all()
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{db_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_database(db_id: int, db: Session = Depends(get_db), _=Depends(_write)):
    record = db.query(Database).filter_by(id=db_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Database not found")
    db.delete(record)
    db.commit()


@router.get("/{db_id}/secret", response_model=DatabaseSecretOut)
def get_database_secret(db_id: int, db: Session = Depends(get_db), _=Depends(_secrets)):
    record = db.query(Database).filter_by(id=db_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Database not found")
    return DatabaseSecretOut(admin_password=decrypt_secret(record.admin_password_encrypted or ""))
