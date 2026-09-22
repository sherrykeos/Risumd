from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
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
    db: Session = Depends(get_db),
):
    return skill_service.get_all(db, skip=skip, limit=limit, category=category)


@router.get("/{id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
def get_skill(id: int, db: Session = Depends(get_db)):
    return skill_service.get_by_id(db, id)


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(data: SkillCreate, db: Session = Depends(get_db)):
    return skill_service.create(db, data)


@router.patch("/{id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
def update_skill(id: int, data: SkillUpdate, db: Session = Depends(get_db)):
    return skill_service.update(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(id: int, db: Session = Depends(get_db)):
    skill_service.delete(db, id)
