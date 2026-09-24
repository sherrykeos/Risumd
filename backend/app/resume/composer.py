import logging
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload

from app.ai.resume_writer import refine_resume_wording
from app.core.config import settings
from app.matching.types import JobMatchResponse
from app.models.education import Education
from app.models.experience import Experience
from app.models.jd_analysis import JDAnalysis
from app.models.job import Job
from app.models.project import Project
from app.resume.constants import (
    MAX_ACHIEVEMENTS,
    MAX_EXPERIENCES,
    MAX_PROJECTS,
    MAX_SKILLS,
    MAX_TECHNOLOGIES,
)
from app.resume.schemas import (
    ContactInfo,
    ResumeData,
    ResumeEducationItem,
    ResumeExperienceItem,
    ResumeProjectItem,
    ResumeSkillGroup,
    ResumeGenerateRequest,
)

logger = logging.getLogger(__name__)


def _format_date(d) -> Optional[str]:
    if not d:
        return None
    return d.strftime("%b %Y")


def compose_resume(
    db: Session,
    job: Job,
    job_analysis: JDAnalysis,
    matches: JobMatchResponse,
    overrides: Optional[ResumeGenerateRequest] = None,
    skip_ai: bool = False,
) -> ResumeData:
    """
    Deterministically selects relevant Career Vault items using matching engine scores,
    constructs a strongly-typed factual draft, and refines wording with Gemini (or fallback).
    """
    # 1. Contact Information
    contact = ContactInfo(
        name=(overrides and overrides.name) or settings.DEFAULT_CANDIDATE_NAME,
        email=(overrides and overrides.email) or settings.DEFAULT_CANDIDATE_EMAIL,
        phone=(overrides and overrides.phone) or settings.DEFAULT_CANDIDATE_PHONE,
        location=(overrides and overrides.location) or settings.DEFAULT_CANDIDATE_LOCATION,
        github=(overrides and overrides.github) or settings.DEFAULT_CANDIDATE_GITHUB,
        linkedin=(overrides and overrides.linkedin) or settings.DEFAULT_CANDIDATE_LINKEDIN,
        portfolio=(overrides and overrides.portfolio) or settings.DEFAULT_CANDIDATE_PORTFOLIO,
    )

    # 2. Select Projects
    selected_project_ids = [p.id for p in matches.projects[:MAX_PROJECTS]]
    db_projects = []
    if selected_project_ids:
        db_projects = (
            db.query(Project)
            .options(
                selectinload(Project.skills),
                selectinload(Project.technologies),
                selectinload(Project.achievements),
            )
            .filter(Project.id.in_(selected_project_ids))
            .all()
        )
        # Preserve rank order
        proj_map = {p.id: p for p in db_projects}
        db_projects = [proj_map[pid] for pid in selected_project_ids if pid in proj_map]

    resume_projects: List[ResumeProjectItem] = []
    for proj in db_projects:
        bullets = []
        if proj.description:
            bullets.append(proj.description.strip())
        for ach in proj.achievements:
            bullet_text = ach.title.strip()
            if ach.description:
                bullet_text += f" ({ach.description.strip()})"
            if bullet_text not in bullets:
                bullets.append(bullet_text)

        tech_names = [t.name for t in proj.technologies]

        resume_projects.append(
            ResumeProjectItem(
                id=proj.id,
                name=proj.name,
                role=proj.role,
                start_date=_format_date(proj.start_date),
                end_date=_format_date(proj.end_date),
                github_url=proj.github_url,
                live_url=proj.live_url,
                technologies=tech_names,
                bullets=bullets,
            )
        )

    # 3. Select Experience
    selected_exp_ids = [e.id for e in matches.experiences[:MAX_EXPERIENCES]]
    db_experiences = []
    if selected_exp_ids:
        db_experiences = (
            db.query(Experience)
            .options(
                selectinload(Experience.skills),
                selectinload(Experience.technologies),
                selectinload(Experience.achievements),
            )
            .filter(Experience.id.in_(selected_exp_ids))
            .all()
        )
        exp_map = {e.id: e for e in db_experiences}
        db_experiences = [exp_map[eid] for eid in selected_exp_ids if eid in exp_map]

    resume_experiences: List[ResumeExperienceItem] = []
    for exp in db_experiences:
        bullets = []
        if exp.description:
            bullets.append(exp.description.strip())
        for ach in exp.achievements:
            bullet_text = ach.title.strip()
            if ach.description:
                bullet_text += f" ({ach.description.strip()})"
            if bullet_text not in bullets:
                bullets.append(bullet_text)

        tech_names = [t.name for t in exp.technologies]

        resume_experiences.append(
            ResumeExperienceItem(
                id=exp.id,
                company=exp.company,
                role=exp.role,
                location=exp.location,
                start_date=_format_date(exp.start_date),
                end_date=_format_date(exp.end_date),
                technologies=tech_names,
                bullets=bullets,
            )
        )

    # 4. Select Skills & Technologies
    skill_names = [s.name for s in matches.skills[:MAX_SKILLS]]
    tech_names = [t.name for t in matches.technologies[:MAX_TECHNOLOGIES]]

    skill_groups: List[ResumeSkillGroup] = []
    if skill_names:
        skill_groups.append(ResumeSkillGroup(category="Core Skills", skills=skill_names))
    if tech_names:
        skill_groups.append(ResumeSkillGroup(category="Technologies & Frameworks", skills=tech_names))

    # 5. Select Education
    db_education = db.query(Education).order_by(Education.end_date.desc().nullslast(), Education.start_date.desc().nullslast()).all()
    resume_education = [
        ResumeEducationItem(
            id=edu.id,
            institution=edu.institution,
            degree=edu.degree,
            field=edu.field,
            start_date=_format_date(edu.start_date),
            end_date=_format_date(edu.end_date),
            grade=edu.grade,
            description=edu.description,
        )
        for edu in db_education
    ]

    # 6. Select Achievements
    achievement_titles = [a.title for a in matches.achievements[:MAX_ACHIEVEMENTS]]

    # 7. Initial factual summary
    initial_summary = (
        f"Experienced software engineer with expertise in {', '.join(skill_names[:4] or ['software engineering'])}. "
        f"Proven track record of delivering projects using {', '.join(tech_names[:4] or ['modern tech stacks'])}."
    )

    draft = ResumeData(
        contact=contact,
        summary=initial_summary,
        skill_groups=skill_groups,
        skills=skill_names,
        technologies=tech_names,
        experience=resume_experiences,
        projects=resume_projects,
        education=resume_education,
        achievements=achievement_titles,
    )

    if skip_ai:
        return draft

    # 8. Refine wording via Gemini (with automatic factual fallback on failure)
    return refine_resume_wording(draft=draft, job_analysis=job_analysis)
