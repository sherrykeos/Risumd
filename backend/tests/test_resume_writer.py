from unittest.mock import MagicMock
import pytest

from app.ai.resume_writer import refine_resume_wording
from app.models.jd_analysis import JDAnalysis
from app.resume.schemas import ContactInfo, ResumeData, ResumeProjectItem


def test_resume_writer_fallback_on_client_error():
    draft = ResumeData(
        contact=ContactInfo(name="Factual User", email="user@example.com"),
        summary="Original factual summary",
        projects=[
            ResumeProjectItem(id=1, name="Original Project", bullets=["Built backend with Python"])
        ],
    )
    jd_analysis = JDAnalysis(job_id=1, required_skills=["Python"], summary="Job summary")

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("API connection timeout")

    refined = refine_resume_wording(draft=draft, job_analysis=jd_analysis, client=mock_client)

    # Must return original draft unchanged on error
    assert refined.summary == "Original factual summary"
    assert refined.projects[0].bullets == ["Built backend with Python"]


def test_resume_writer_successful_refinement_preserves_contact_and_education():
    draft = ResumeData(
        contact=ContactInfo(name="Factual User", email="user@example.com"),
        summary="Original factual summary",
        projects=[
            ResumeProjectItem(id=1, name="Original Project", bullets=["Built backend with Python"])
        ],
    )
    jd_analysis = JDAnalysis(job_id=1, required_skills=["Python"], summary="Job summary")

    refined_json = """{
      "contact": {"name": "Hacked Name", "email": "hacked@example.com"},
      "summary": "Tailored senior Python engineer summary",
      "skill_groups": [],
      "skills": ["Python"],
      "technologies": ["FastAPI"],
      "experience": [],
      "projects": [
        {"id": 1, "name": "Original Project", "bullets": ["Engineered high-performance backend using Python"]}
      ],
      "education": [],
      "achievements": []
    }"""

    mock_response = MagicMock()
    mock_response.text = refined_json
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    refined = refine_resume_wording(draft=draft, job_analysis=jd_analysis, client=mock_client)

    # Refined wording applied
    assert refined.summary == "Tailored senior Python engineer summary"
    assert refined.projects[0].bullets == ["Engineered high-performance backend using Python"]

    # Critical security guardrail: fixed contact fields remain preserved from original factual draft
    assert refined.contact.name == "Factual User"
    assert refined.contact.email == "user@example.com"
