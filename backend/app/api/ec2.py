from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.ec2 import EC2Server
from app.models.application import Application
from app.models.team import Team
from app.schemas.ec2 import EC2Out, EC2Create, EC2Update, EC2SecretOut
from app.core.security import encrypt_secret, decrypt_secret
from app.core.deps import require_permission

router = APIRouter(prefix="/ec2", tags=["ec2"])
_read = require_permission("can_read_inventory")
_write = require_permission("can_write_inventory")
_secrets = require_permission("can_view_secrets")


@router.get("", response_model=list[EC2Out])
def list_ec2(
    search: str | None = None,
    environment: str | None = None,
    application_id: int | None = None,
    team_id: int | None = None,
    db: Session = Depends(get_db),
    _=Depends(_read),
):
    q = db.query(EC2Server)
    if search:
        q = q.filter(EC2Server.name.ilike(f"%{search}%"))
    if environment:
        q = q.filter(EC2Server.environment == environment)
    if application_id:
        q = q.filter(EC2Server.applications.any(Application.id == application_id))
    if team_id:
        q = q.filter(EC2Server.teams.any(Team.id == team_id))
    return q.order_by(EC2Server.name).all()


@router.post("", response_model=EC2Out, status_code=status.HTTP_201_CREATED)
def create_ec2(body: EC2Create, db: Session = Depends(get_db), _=Depends(_write)):
    data = body.model_dump(exclude={"ssh_private_key", "application_ids", "team_ids"})
    record = EC2Server(**data)
    if body.ssh_private_key:
        record.ssh_private_key_encrypted = encrypt_secret(body.ssh_private_key)
    record.applications = db.query(Application).filter(Application.id.in_(body.application_ids)).all()
    record.teams = db.query(Team).filter(Team.id.in_(body.team_ids)).all()
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{ec2_id}", response_model=EC2Out)
def get_ec2(ec2_id: int, db: Session = Depends(get_db), _=Depends(_read)):
    record = db.query(EC2Server).filter_by(id=ec2_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="EC2 server not found")
    return record


@router.put("/{ec2_id}", response_model=EC2Out)
def update_ec2(ec2_id: int, body: EC2Update, db: Session = Depends(get_db), _=Depends(_write)):
    record = db.query(EC2Server).filter_by(id=ec2_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="EC2 server not found")
    data = body.model_dump(exclude_unset=True, exclude={"ssh_private_key", "application_ids", "team_ids"})
    for field, value in data.items():
        setattr(record, field, value)
    if body.ssh_private_key is not None:
        record.ssh_private_key_encrypted = encrypt_secret(body.ssh_private_key)
    if body.application_ids is not None:
        record.applications = db.query(Application).filter(Application.id.in_(body.application_ids)).all()
    if body.team_ids is not None:
        record.teams = db.query(Team).filter(Team.id.in_(body.team_ids)).all()
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{ec2_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ec2(ec2_id: int, db: Session = Depends(get_db), _=Depends(_write)):
    record = db.query(EC2Server).filter_by(id=ec2_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="EC2 server not found")
    db.delete(record)
    db.commit()


@router.get("/{ec2_id}/secret", response_model=EC2SecretOut)
def get_ec2_secret(ec2_id: int, db: Session = Depends(get_db), _=Depends(_secrets)):
    record = db.query(EC2Server).filter_by(id=ec2_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="EC2 server not found")
    return EC2SecretOut(ssh_private_key=decrypt_secret(record.ssh_private_key_encrypted or ""))
