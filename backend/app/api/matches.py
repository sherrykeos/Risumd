from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.matching.types import JobMatchResponse
from app.services.matching_service import matching_service

router = APIRouter(prefix="/jobs", tags=["Matching"])


@router.get(
    "/{id}/matches",
    response_model=JobMatchResponse,
    summary="Get Career Vault matches for a Job and JD Analysis",
)
def get_job_matches(id: int, db: Session = Depends(get_db)) -> JobMatchResponse:
    return matching_service.get_job_matches(db, id)
