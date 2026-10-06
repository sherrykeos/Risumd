from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.matching.types import JobMatchResponse
from app.services.matching_service import matching_service

router = APIRouter(prefix="/jobs", tags=["Matching"])


@router.get(
    "/{id}/matches",
    response_model=JobMatchResponse,
    summary="Get Career Vault matches for a Job and JD Analysis",
)
def get_job_matches(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobMatchResponse:
    return matching_service.get_job_matches(db, job_id=id, user_id=current_user.id)
