import json
import logging
from typing import Optional
from pydantic import ValidationError
from google.genai import types

from app.ai.client import get_gemini_client
from app.ai.prompts import JD_ANALYSIS_SYSTEM_PROMPT, format_jd_prompt
from app.core.config import settings
from app.core.exceptions import ValidationException, GeminiServiceException
from app.schemas.jd_analysis import JDAnalysisCreate

logger = logging.getLogger(__name__)


def _clean_list(items: Optional[list]) -> list[str]:
    """Strips whitespace and eliminates blank entries from a list of strings."""
    if not items:
        return []
    cleaned = []
    for item in items:
        if isinstance(item, str):
            s = item.strip()
            if s and s not in cleaned:
                cleaned.append(s)
    return cleaned


def analyze_job_description(
    raw_description: str,
    client: Optional[object] = None,
    model: Optional[str] = None,
) -> JDAnalysisCreate:
    """
    Sends raw job description to Gemini and returns structured JDAnalysisCreate data.
    Validates input and response using Pydantic.
    """
    if not raw_description or not raw_description.strip():
        raise ValidationException("Job description cannot be empty")

    active_client = client or get_gemini_client()
    active_model = model or settings.GEMINI_MODEL

    try:
        response = active_client.models.generate_content(
            model=active_model,
            contents=format_jd_prompt(raw_description),
            config=types.GenerateContentConfig(
                system_instruction=JD_ANALYSIS_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=JDAnalysisCreate,
                temperature=0.1,
            ),
        )
    except Exception as e:
        logger.error(f"Gemini API error during JD analysis: {type(e).__name__}")
        # Strip any potential secrets or sensitive internals from exception message
        error_msg = str(e).split("\n")[0]
        raise GeminiServiceException(f"Gemini API error: {error_msg}")

    if not response or not getattr(response, "text", None):
        raise GeminiServiceException("Gemini returned an empty or invalid response")

    try:
        data = JDAnalysisCreate.model_validate_json(response.text)
    except (ValidationError, json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to validate Gemini response against schema: {e}")
        raise GeminiServiceException("Failed to validate structured JD analysis from Gemini response.")

    # Clean and normalize list fields
    return JDAnalysisCreate(
        seniority=data.seniority.strip() if data.seniority else None,
        domain=data.domain.strip() if data.domain else None,
        required_skills=_clean_list(data.required_skills),
        preferred_skills=_clean_list(data.preferred_skills),
        technologies=_clean_list(data.technologies),
        responsibilities=_clean_list(data.responsibilities),
        keywords=_clean_list(data.keywords),
        summary=data.summary.strip() if data.summary else None,
    )
