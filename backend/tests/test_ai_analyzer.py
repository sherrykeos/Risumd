import json
from unittest.mock import MagicMock
import pytest

from app.ai.jd_analyzer import analyze_job_description
from app.ai.client import get_gemini_client
from app.core.exceptions import (
    ValidationException,
    GeminiServiceException,
    GeminiConfigurationException,
)
from app.schemas.jd_analysis import JDAnalysisCreate


SAMPLE_STRUCTURED_RESPONSE = {
    "seniority": "Senior",
    "domain": "Backend Engineering",
    "required_skills": ["System Design", "Microservices Architecture", "REST API Design"],
    "preferred_skills": ["Docker", "Kubernetes"],
    "technologies": ["Python", "FastAPI", "PostgreSQL", "Redis"],
    "responsibilities": [
        "Architect and maintain high-throughput backend APIs",
        "Optimize complex PostgreSQL queries and schemas",
    ],
    "keywords": ["backend", "Python", "FastAPI", "PostgreSQL", "microservices"],
    "summary": "Senior backend role focusing on Python and FastAPI microservices with PostgreSQL database optimization.",
}


def test_analyze_job_description_valid():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps(SAMPLE_STRUCTURED_RESPONSE)
    mock_client.models.generate_content.return_value = mock_response

    raw_jd = "Looking for a Senior Backend Engineer proficient in Python, FastAPI, and PostgreSQL."
    result = analyze_job_description(raw_jd, client=mock_client)

    assert isinstance(result, JDAnalysisCreate)
    assert result.seniority == "Senior"
    assert result.domain == "Backend Engineering"
    assert "Python" in result.technologies
    assert "PostgreSQL" in result.technologies
    assert "System Design" in result.required_skills
    assert "Docker" in result.preferred_skills
    assert len(result.responsibilities) == 2
    assert "backend" in result.keywords
    assert result.summary.startswith("Senior backend role")


def test_analyze_job_description_empty_input():
    with pytest.raises(ValidationException) as exc:
        analyze_job_description("")
    assert "Job description cannot be empty" in str(exc.value)

    with pytest.raises(ValidationException) as exc2:
        analyze_job_description("    \n\t  ")
    assert "Job description cannot be empty" in str(exc2.value)


def test_analyze_job_description_malformed_json_response():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "This is not valid JSON"
    mock_client.models.generate_content.return_value = mock_response

    with pytest.raises(GeminiServiceException) as exc:
        analyze_job_description("Sample job description", client=mock_client)
    assert "Failed to validate structured JD analysis" in str(exc.value)


def test_analyze_job_description_empty_response():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = None
    mock_client.models.generate_content.return_value = mock_response

    with pytest.raises(GeminiServiceException) as exc:
        analyze_job_description("Sample job description", client=mock_client)
    assert "Gemini returned an empty or invalid response" in str(exc.value)


def test_analyze_job_description_provider_api_error():
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("Resource exhausted: quota exceeded")

    with pytest.raises(GeminiServiceException) as exc:
        analyze_job_description("Sample job description", client=mock_client)
    assert "Gemini API error" in str(exc.value)
    assert "quota exceeded" in str(exc.value)


def test_get_gemini_client_missing_key(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.GEMINI_API_KEY", None)
    with pytest.raises(GeminiConfigurationException) as exc:
        get_gemini_client()
    assert "Gemini API key is not configured" in str(exc.value)

    monkeypatch.setattr("app.core.config.settings.GEMINI_API_KEY", "   ")
    with pytest.raises(GeminiConfigurationException) as exc2:
        get_gemini_client()
    assert "Gemini API key is not configured" in str(exc2.value)
