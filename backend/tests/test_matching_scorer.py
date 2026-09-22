from types import SimpleNamespace
from datetime import date
import pytest

from app.matching.scorer import (
    JDAnalysisContext,
    score_project,
    score_experience,
    score_skill,
    score_technology,
    score_achievement,
    rank_projects,
    rank_experiences,
    rank_skills,
    rank_technologies,
    rank_achievements,
)


@pytest.fixture
def sample_analysis():
    return SimpleNamespace(
        seniority="Senior",
        domain="Backend Development",
        required_skills=["Backend Architecture", "System Design"],
        preferred_skills=["Docker", "Kubernetes"],
        technologies=["Python", "PostgreSQL", "FastAPI"],
        responsibilities=[
            "Design and build scalable microservices",
            "Optimize PostgreSQL database queries and indexes",
        ],
        keywords=["microservices", "low-latency", "caching", "database"],
        summary="Senior Backend Engineer role architecting distributed microservices and database infrastructure.",
    )


def test_exact_technology_match(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    project = SimpleNamespace(
        id=1,
        name="API Gateway",
        role="Backend Engineer",
        description="A gateway service",
        technologies=[SimpleNamespace(name="Python"), SimpleNamespace(name="PostgreSQL")],
        skills=[],
        achievements=[],
    )
    score, breakdown = score_project(project, ctx)
    assert score > 0.0
    assert "Python" in breakdown.matched_technologies
    assert "PostgreSQL" in breakdown.matched_technologies
    assert any("Matched 2 JD technologies" in r for r in breakdown.reasons)


def test_exact_skill_match(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    project = SimpleNamespace(
        id=1,
        name="Distributed Cache",
        role="Architect",
        description="Internal caching service",
        technologies=[],
        skills=[SimpleNamespace(name="Backend Architecture"), SimpleNamespace(name="System Design")],
        achievements=[],
    )
    score, breakdown = score_project(project, ctx)
    assert score > 0.0
    assert "Backend Architecture" in breakdown.matched_skills
    assert "System Design" in breakdown.matched_skills
    assert any("Matched 2 required skills" in r for r in breakdown.reasons)


def test_required_vs_preferred_skill_weighting(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    # Project A matches 1 required skill
    proj_a = SimpleNamespace(
        id=1,
        name="Project A",
        role=None,
        description=None,
        technologies=[],
        skills=[SimpleNamespace(name="System Design")],  # Required
        achievements=[],
    )
    # Project B matches 1 preferred skill
    proj_b = SimpleNamespace(
        id=2,
        name="Project B",
        role=None,
        description=None,
        technologies=[],
        skills=[SimpleNamespace(name="Docker")],  # Preferred
        achievements=[],
    )

    score_a, breakdown_a = score_project(proj_a, ctx)
    score_b, breakdown_b = score_project(proj_b, ctx)

    # Required skill match MUST score significantly higher than preferred skill match
    assert score_a > score_b
    assert "System Design" in breakdown_a.matched_skills
    assert "Docker" in breakdown_b.matched_skills


def test_keyword_and_responsibility_match(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    project = SimpleNamespace(
        id=1,
        name="Low-Latency Database Engine",
        role="Engineer",
        description="Engineered low-latency caching layer to optimize PostgreSQL database queries",
        technologies=[],
        skills=[],
        achievements=[
            SimpleNamespace(
                title="Microservices optimization",
                description="Refactored microservices architecture",
            )
        ],
    )
    score, breakdown = score_project(project, ctx)
    assert score > 0.0
    assert "microservices" in breakdown.matched_keywords
    assert "caching" in breakdown.matched_keywords
    assert "low-latency" in breakdown.matched_keywords


def test_unrelated_item_scores_zero(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    project = SimpleNamespace(
        id=99,
        name="Oil Painting Portfolio",
        role="Artist",
        description="Fine arts gallery with acrylic and oil canvases.",
        technologies=[SimpleNamespace(name="Photoshop"), SimpleNamespace(name="Illustrator")],
        skills=[SimpleNamespace(name="Visual Arts"), SimpleNamespace(name="Color Theory")],
        achievements=[],
    )
    score, breakdown = score_project(project, ctx)
    assert score == 0.0
    assert len(breakdown.matched_technologies) == 0
    assert len(breakdown.matched_skills) == 0
    assert len(breakdown.matched_keywords) == 0
    assert "No matching skills, technologies, or keywords found" in breakdown.reasons


def test_score_normalization_bounds(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)
    # Perfect match across everything
    perfect_proj = SimpleNamespace(
        id=1,
        name="Senior Backend Engineer Role",
        role="Senior Backend Engineer",
        description="Senior Backend Engineer role architecting distributed microservices and database infrastructure.",
        technologies=[
            SimpleNamespace(name="Python"),
            SimpleNamespace(name="PostgreSQL"),
            SimpleNamespace(name="FastAPI"),
        ],
        skills=[
            SimpleNamespace(name="Backend Architecture"),
            SimpleNamespace(name="System Design"),
            SimpleNamespace(name="Docker"),
            SimpleNamespace(name="Kubernetes"),
        ],
        achievements=[
            SimpleNamespace(
                title="Low-latency microservices caching",
                description="Design and build scalable microservices and optimize PostgreSQL database queries",
            )
        ],
    )
    score, breakdown = score_project(perfect_proj, ctx)
    assert 0.0 <= score <= 1.0
    assert score >= 0.90


def test_ranking_deterministic_order(sample_analysis):
    proj1 = SimpleNamespace(
        id=1,
        name="Alpha Project",
        role="Lead",
        description="A Python backend project",
        technologies=[SimpleNamespace(name="Python")],
        skills=[],
        achievements=[],
    )
    proj2 = SimpleNamespace(
        id=2,
        name="Beta Project",
        role="Lead",
        description="Python and PostgreSQL with System Design",
        technologies=[SimpleNamespace(name="Python"), SimpleNamespace(name="PostgreSQL")],
        skills=[SimpleNamespace(name="System Design")],
        achievements=[],
    )

    ranked_forward = rank_projects([proj1, proj2], sample_analysis)
    ranked_backward = rank_projects([proj2, proj1], sample_analysis)

    # proj2 has higher score, must always be ranked #1
    assert ranked_forward[0].id == 2
    assert ranked_forward[1].id == 1
    assert ranked_backward[0].id == 2
    assert ranked_backward[1].id == 1


def test_experience_ranking_and_tie_breaking(sample_analysis):
    exp1 = SimpleNamespace(
        id=1,
        company="Acme Corp",
        role="Backend Engineer",
        description="Python backend",
        start_date=date(2021, 1, 1),
        technologies=[SimpleNamespace(name="Python")],
        skills=[],
        achievements=[],
    )
    exp2 = SimpleNamespace(
        id=2,
        company="Zenith Technologies",
        role="Senior Engineer",
        description="Python, FastAPI, PostgreSQL",
        start_date=date(2023, 1, 1),
        technologies=[
            SimpleNamespace(name="Python"),
            SimpleNamespace(name="FastAPI"),
            SimpleNamespace(name="PostgreSQL"),
        ],
        skills=[SimpleNamespace(name="System Design")],
        achievements=[],
    )

    ranked = rank_experiences([exp1, exp2], sample_analysis)
    assert ranked[0].id == 2
    assert ranked[1].id == 1
    assert ranked[0].score > ranked[1].score


def test_supporting_entities_scoring(sample_analysis):
    ctx = JDAnalysisContext(sample_analysis)

    # Required skill
    skill_req = SimpleNamespace(id=1, name="System Design", category="Engineering", description=None)
    score_req, bd_req = score_skill(skill_req, ctx)
    assert score_req == 1.0

    # Preferred skill
    skill_pref = SimpleNamespace(id=2, name="Docker", category="DevOps", description=None)
    score_pref, bd_pref = score_skill(skill_pref, ctx)
    assert score_pref == 0.75

    # Direct technology match
    tech_direct = SimpleNamespace(id=1, name="PostgreSQL", description=None)
    score_tech, bd_tech = score_technology(tech_direct, ctx)
    assert score_tech == 1.0

    # Achievement score
    ach = SimpleNamespace(
        id=1,
        title="PostgreSQL query optimization",
        description="Reduced database query latency by 50%",
    )
    score_ach, bd_ach = score_achievement(ach, ctx)
    assert score_ach > 0.0
