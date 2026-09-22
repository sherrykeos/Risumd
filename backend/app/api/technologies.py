from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.technology import (
    TechnologyCreate,
    TechnologyUpdate,
    TechnologyResponse,
)
from app.services.technology_service import technology_service

router = APIRouter(prefix="/technologies", tags=["Technologies"])


@router.get("", response_model=List[TechnologyResponse], status_code=status.HTTP_200_OK)
def list_technologies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return technology_service.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=TechnologyResponse, status_code=status.HTTP_200_OK)
def get_technology(id: int, db: Session = Depends(get_db)):
    return technology_service.get_by_id(db, id)


@router.post("", response_model=TechnologyResponse, status_code=status.HTTP_201_CREATED)
def create_technology(data: TechnologyCreate, db: Session = Depends(get_db)):
    return technology_service.create(db, data)


@router.patch("/{id}", response_model=TechnologyResponse, status_code=status.HTTP_200_OK)
def update_technology(id: int, data: TechnologyUpdate, db: Session = Depends(get_db)):
    return technology_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(id: int, db: Session = Depends(get_db)):
    technology_service.delete(db, id)
