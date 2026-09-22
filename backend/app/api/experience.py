from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
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
    db: Session = Depends(get_db),
):
    return experience_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=ExperienceResponse, status_code=status.HTTP_200_OK)
def get_experience(id: int, db: Session = Depends(get_db)):
    return experience_service.get_by_id(db, id)


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def create_experience(data: ExperienceCreate, db: Session = Depends(get_db)):
    return experience_service.create(db, data)


@router.patch("/{id}", response_model=ExperienceResponse, status_code=status.HTTP_200_OK)
def update_experience(id: int, data: ExperienceUpdate, db: Session = Depends(get_db)):
    return experience_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(id: int, db: Session = Depends(get_db)):
    experience_service.delete(db, id)
