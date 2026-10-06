from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.skill import (
    SkillCreate,
    SkillUpdate,
    SkillResponse,
)
from app.services.skill_service import skill_service

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=List[SkillResponse], status_code=status.HTTP_200_OK)
def list_skills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return skill_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit, category=category)


@router.get("/{id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
def get_skill(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return skill_service.get_by_id(db, skill_id=id, user_id=current_user.id)


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return skill_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
def update_skill(
    id: int,
    data: SkillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return skill_service.update(db, skill_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill_service.delete(db, skill_id=id, user_id=current_user.id)
