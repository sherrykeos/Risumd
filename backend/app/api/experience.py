from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.experience import (
    ExperienceCreate,
    ExperienceUpdate,
    ExperienceResponse,
)
from app.services.experience_service import experience_service

router = APIRouter(prefix="/experience", tags=["Experience"])


@router.get("", response_model=List[ExperienceResponse], status_code=status.HTTP_200_OK)
def list_experience(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return experience_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=ExperienceResponse, status_code=status.HTTP_200_OK)
def get_experience(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return experience_service.get_by_id(db, experience_id=id, user_id=current_user.id)


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def create_experience(
    data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return experience_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=ExperienceResponse, status_code=status.HTTP_200_OK)
def update_experience(
    id: int,
    data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return experience_service.update(db, experience_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    experience_service.delete(db, experience_id=id, user_id=current_user.id)
