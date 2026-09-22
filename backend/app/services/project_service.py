from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.technology_service import technology_service
from app.services.skill_service import skill_service
from app.services.achievement_service import achievement_service


class ProjectService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Project]:
        stmt = (
            select(Project)
            .order_by(Project.start_date.desc().nullslast(), Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Project:
        stmt = select(Project).where(Project.id == project_id)
        project = db.scalar(stmt)
        if not project:
            raise EntityNotFoundException("Project", project_id)
        return project

    @staticmethod
    def create(db: Session, data: ProjectCreate) -> Project:
        project = Project(
            name=data.name.strip(),
            description=data.description,
            role=data.role.strip() if data.role else None,
            start_date=data.start_date,
            end_date=data.end_date,
            github_url=data.github_url,
            live_url=data.live_url,
        )
        db.add(project)

        if data.technologies:
            project.technologies = technology_service.get_or_create_multiple(db, data.technologies)

        if data.skills:
            project.skills = skill_service.get_or_create_multiple(db, data.skills)

        if data.achievements:
            project.achievements = achievement_service.resolve_or_create_multiple(db, data.achievements)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update(db: Session, project_id: int, data: ProjectUpdate) -> Project:
        project = ProjectService.get_by_id(db, project_id)

        if data.name is not None:
            project.name = data.name.strip()
        if data.description is not None:
            project.description = data.description
        if data.role is not None:
            project.role = data.role.strip() if data.role else None
        if data.start_date is not None:
            project.start_date = data.start_date
        if data.end_date is not None:
            project.end_date = data.end_date
        if data.github_url is not None:
            project.github_url = data.github_url
        if data.live_url is not None:
            project.live_url = data.live_url

        if data.technologies is not None:
            project.technologies = technology_service.get_or_create_multiple(db, data.technologies)

        if data.skills is not None:
            project.skills = skill_service.get_or_create_multiple(db, data.skills)

        if data.achievements is not None:
            project.achievements = achievement_service.resolve_or_create_multiple(db, data.achievements)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete(db: Session, project_id: int) -> None:
        project = ProjectService.get_by_id(db, project_id)
        db.delete(project)
        db.commit()


project_service = ProjectService()
