from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.education import (
    EducationCreate,
    EducationUpdate,
    EducationResponse,
)
from app.services.education_service import education_service

router = APIRouter(prefix="/education", tags=["Education"])


@router.get("", response_model=List[EducationResponse], status_code=status.HTTP_200_OK)
def list_education(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return education_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=EducationResponse, status_code=status.HTTP_200_OK)
def get_education(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return education_service.get_by_id(db, education_id=id, user_id=current_user.id)


@router.post("", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def create_education(
    data: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return education_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=EducationResponse, status_code=status.HTTP_200_OK)
def update_education(
    id: int,
    data: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return education_service.update(db, education_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    education_service.delete(db, education_id=id, user_id=current_user.id)
