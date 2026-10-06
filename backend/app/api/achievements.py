from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.achievement import (
    AchievementCreate,
    AchievementUpdate,
    AchievementResponse,
)
from app.services.achievement_service import achievement_service

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("", response_model=List[AchievementResponse], status_code=status.HTTP_200_OK)
def list_achievements(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return achievement_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=AchievementResponse, status_code=status.HTTP_200_OK)
def get_achievement(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return achievement_service.get_by_id(db, achievement_id=id, user_id=current_user.id)


@router.post("", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
def create_achievement(
    data: AchievementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return achievement_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=AchievementResponse, status_code=status.HTTP_200_OK)
def update_achievement(
    id: int,
    data: AchievementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return achievement_service.update(db, achievement_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_achievement(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    achievement_service.delete(db, achievement_id=id, user_id=current_user.id)
