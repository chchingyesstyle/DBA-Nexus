from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.application import Application
from app.schemas.application import ApplicationOut, ApplicationCreate, ApplicationUpdate
from app.core.deps import get_current_user, require_permission

router = APIRouter(prefix="/applications", tags=["applications"])
_write = require_permission("can_write_inventory")


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    search: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Application)
    if search:
        q = q.filter(Application.name.ilike(f"%{search}%"))
    return q.order_by(Application.name).all()


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(body: ApplicationCreate, db: Session = Depends(get_db), _=Depends(_write)):
    app = Application(**body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    app = db.query(Application).filter_by(id=app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{app_id}", response_model=ApplicationOut)
def update_application(app_id: int, body: ApplicationUpdate, db: Session = Depends(get_db), _=Depends(_write)):
    app = db.query(Application).filter_by(id=app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: int, db: Session = Depends(get_db), _=Depends(_write)):
    app = db.query(Application).filter_by(id=app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
