from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
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
    db: Session = Depends(get_db),
):
    return achievement_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=AchievementResponse, status_code=status.HTTP_200_OK)
def get_achievement(id: int, db: Session = Depends(get_db)):
    return achievement_service.get_by_id(db, id)


@router.post("", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
def create_achievement(data: AchievementCreate, db: Session = Depends(get_db)):
    return achievement_service.create(db, data)


@router.patch("/{id}", response_model=AchievementResponse, status_code=status.HTTP_200_OK)
def update_achievement(id: int, data: AchievementUpdate, db: Session = Depends(get_db)):
    return achievement_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_achievement(id: int, db: Session = Depends(get_db)):
    achievement_service.delete(db, id)
