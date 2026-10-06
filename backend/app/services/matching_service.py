from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import EntityNotFoundException, JobAnalysisMissingException
from app.models.job import Job
from app.models.project import Project
from app.models.experience import Experience
from app.models.skill import Skill
from app.models.technology import Technology
from app.models.achievement import Achievement
from app.matching.types import JobMatchResponse
from app.matching.scorer import (
    rank_projects,
    rank_experiences,
    rank_skills,
    rank_technologies,
    rank_achievements,
)


class MatchingService:
    @staticmethod
    def get_job_matches(db: Session, job_id: int, user_id: int) -> JobMatchResponse:
        """
        Calculates on-demand deterministic relevance scores and rankings
        between a target Job + JDAnalysis and the authenticated user's Career Vault only.
        """
        job = (
            db.query(Job)
            .options(selectinload(Job.analysis))
            .filter(Job.id == job_id, Job.user_id == user_id)
            .first()
        )
        if not job:
            raise EntityNotFoundException("Job", job_id)

        if not job.analysis:
            raise JobAnalysisMissingException(job_id)

        # Load ONLY the authenticated user's Career Vault entities
        projects = (
            db.query(Project)
            .options(
                selectinload(Project.technologies),
                selectinload(Project.skills),
                selectinload(Project.achievements),
            )
            .filter(Project.user_id == user_id)
            .all()
        )

        experiences = (
            db.query(Experience)
            .options(
                selectinload(Experience.technologies),
                selectinload(Experience.skills),
                selectinload(Experience.achievements),
            )
            .filter(Experience.user_id == user_id)
            .all()
        )

        skills = db.query(Skill).filter(Skill.user_id == user_id).all()
        technologies = db.query(Technology).filter(Technology.user_id == user_id).all()
        achievements = db.query(Achievement).filter(Achievement.user_id == user_id).all()

        # Deterministic scoring and ranking
        ranked_projects = rank_projects(projects, job.analysis)
        ranked_experiences = rank_experiences(experiences, job.analysis)
        ranked_skills = rank_skills(skills, job.analysis)
        ranked_technologies = rank_technologies(technologies, job.analysis)
        ranked_achievements = rank_achievements(achievements, job.analysis)

        return JobMatchResponse(
            job_id=job.id,
            job_title=job.title,
            company=job.company,
            projects=ranked_projects,
            experiences=ranked_experiences,
            skills=ranked_skills,
            technologies=ranked_technologies,
            achievements=ranked_achievements,
        )


matching_service = MatchingService()
