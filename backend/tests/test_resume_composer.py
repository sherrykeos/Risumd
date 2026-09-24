import pytest
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.models.project import Project
from app.models.experience import Experience
from app.models.skill import Skill
from app.models.technology import Technology
from app.models.education import Education
from app.matching.types import (
    JobMatchResponse,
    MatchBreakdown,
    RankedExperience,
    RankedProject,
    RankedSkill,
    RankedTechnology,
)
from app.resume.composer import compose_resume
from app.resume.schemas import ResumeGenerateRequest


def test_compose_resume_deterministic_selection_and_limits(db_session):
    py_tech = Technology(name="Python")
    fa_tech = Technology(name="FastAPI")
    pg_tech = Technology(name="PostgreSQL")
    docker_tech = Technology(name="Docker")

    proj1 = Project(name="Project Alpha", description="Built a FastAPI backend", technologies=[py_tech, fa_tech])
    proj2 = Project(name="Project Beta", description="Built a PostgreSQL database engine", technologies=[pg_tech])
    proj3 = Project(name="Project Gamma", description="Built a Docker deployment script", technologies=[docker_tech])
    proj4 = Project(name="Project Delta", description="Built an unrelated utility")

    exp1 = Experience(company="Acme Corp", role="Senior Backend Engineer", description="Led backend team", technologies=[py_tech, fa_tech])
    exp2 = Experience(company="Beta Inc", role="Software Engineer", description="Maintained databases", technologies=[pg_tech])

    edu1 = Education(institution="Tech University", degree="BS Computer Science")

    job = Job(company="Target Co", title="Lead Python Engineer", raw_description="Looking for Python and FastAPI expert.")

    db_session.add_all([py_tech, fa_tech, pg_tech, docker_tech, proj1, proj2, proj3, proj4, exp1, exp2, edu1, job])
    db_session.commit()

    jd_analysis = JDAnalysis(
        job_id=job.id,
        seniority="Senior",
        domain="Backend",
        required_skills=["System Design"],
        technologies=["Python", "FastAPI", "PostgreSQL"],
        summary="Target Python backend role",
    )
    db_session.add(jd_analysis)
    db_session.commit()

    dummy_breakdown = MatchBreakdown(score=0.9, matched_technologies=["Python"])
    mock_matches = JobMatchResponse(
        job_id=job.id,
        job_title=job.title,
        company=job.company,
        projects=[
            RankedProject(id=proj1.id, name=proj1.name, score=0.9, match_breakdown=dummy_breakdown),
            RankedProject(id=proj2.id, name=proj2.name, score=0.8, match_breakdown=dummy_breakdown),
            RankedProject(id=proj3.id, name=proj3.name, score=0.7, match_breakdown=dummy_breakdown),
            RankedProject(id=proj4.id, name=proj4.name, score=0.1, match_breakdown=dummy_breakdown),
        ],
        experiences=[
            RankedExperience(id=exp1.id, company=exp1.company, role=exp1.role, score=0.95, match_breakdown=dummy_breakdown),
            RankedExperience(id=exp2.id, company=exp2.company, role=exp2.role, score=0.85, match_breakdown=dummy_breakdown),
        ],
        skills=[RankedSkill(id=1, name="System Design", score=0.9, match_breakdown=dummy_breakdown)],
        technologies=[
            RankedTechnology(id=1, name="Python", score=0.95, match_breakdown=dummy_breakdown),
            RankedTechnology(id=2, name="FastAPI", score=0.9, match_breakdown=dummy_breakdown),
        ],
    )

    overrides = ResumeGenerateRequest(name="Jane Doe", email="jane@example.com")
    resume_data = compose_resume(
        db=db_session,
        job=job,
        job_analysis=jd_analysis,
        matches=mock_matches,
        overrides=overrides,
        skip_ai=True,
    )

    assert resume_data.contact.name == "Jane Doe"
    assert resume_data.contact.email == "jane@example.com"
    # Respects MAX_PROJECTS limit of 3
    assert len(resume_data.projects) == 3
    assert resume_data.projects[0].name == "Project Alpha"
    assert resume_data.projects[1].name == "Project Beta"
    assert resume_data.projects[2].name == "Project Gamma"

    # Experience selection
    assert len(resume_data.experience) == 2
    assert resume_data.experience[0].company == "Acme Corp"

    # Education entry included
    assert len(resume_data.education) == 1
    assert resume_data.education[0].institution == "Tech University"
