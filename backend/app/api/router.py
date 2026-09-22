from fastapi import APIRouter

from app.api.projects import router as projects_router
from app.api.skills import router as skills_router
from app.api.technologies import router as technologies_router
from app.api.experience import router as experience_router
from app.api.education import router as education_router
from app.api.achievements import router as achievements_router
from app.api.jobs import router as jobs_router
from app.api.jd_analysis import router as jd_analysis_router

api_router = APIRouter()

api_router.include_router(projects_router)
api_router.include_router(skills_router)
api_router.include_router(technologies_router)
api_router.include_router(experience_router)
api_router.include_router(education_router)
api_router.include_router(achievements_router)
api_router.include_router(jobs_router)
api_router.include_router(jd_analysis_router)
