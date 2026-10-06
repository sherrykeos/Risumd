from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return technology_service.get_all(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{id}", response_model=TechnologyResponse, status_code=status.HTTP_200_OK)
def get_technology(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return technology_service.get_by_id(db, tech_id=id, user_id=current_user.id)


@router.post("", response_model=TechnologyResponse, status_code=status.HTTP_201_CREATED)
def create_technology(
    data: TechnologyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return technology_service.create(db, user_id=current_user.id, data=data)


@router.patch("/{id}", response_model=TechnologyResponse, status_code=status.HTTP_200_OK)
def update_technology(
    id: int,
    data: TechnologyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return technology_service.update(db, tech_id=id, user_id=current_user.id, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    technology_service.delete(db, tech_id=id, user_id=current_user.id)
