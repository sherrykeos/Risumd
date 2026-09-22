from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
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
    db: Session = Depends(get_db),
):
    return education_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=EducationResponse, status_code=status.HTTP_200_OK)
def get_education(id: int, db: Session = Depends(get_db)):
    return education_service.get_by_id(db, id)


@router.post("", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def create_education(data: EducationCreate, db: Session = Depends(get_db)):
    return education_service.create(db, data)


@router.patch("/{id}", response_model=EducationResponse, status_code=status.HTTP_200_OK)
def update_education(id: int, data: EducationUpdate, db: Session = Depends(get_db)):
    return education_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(id: int, db: Session = Depends(get_db)):
    education_service.delete(db, id)
