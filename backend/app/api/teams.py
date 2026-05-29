from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.team import Team
from app.schemas.team import TeamOut, TeamCreate, TeamUpdate
from app.core.deps import get_current_user, require_permission

router = APIRouter(prefix="/teams", tags=["teams"])
_write = require_permission("can_write_inventory")


@router.get("", response_model=list[TeamOut])
def list_teams(
    search: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Team)
    if search:
        q = q.filter(Team.name.ilike(f"%{search}%"))
    return q.order_by(Team.name).all()


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(body: TeamCreate, db: Session = Depends(get_db), _=Depends(_write)):
    team = Team(**body.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.put("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, body: TeamUpdate, db: Session = Depends(get_db), _=Depends(_write)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), _=Depends(_write)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
