import json
import logging
from typing import Optional
from google.genai import types
from pydantic import ValidationError

from app.ai.client import get_gemini_client
from app.ai.prompts import RESUME_WRITER_SYSTEM_PROMPT, format_resume_writer_prompt
from app.core.config import settings
from app.core.exceptions import GeminiConfigurationException
from app.models.jd_analysis import JDAnalysis
from app.resume.schemas import ResumeData

logger = logging.getLogger(__name__)


def refine_resume_wording(
    draft: ResumeData,
    job_analysis: JDAnalysis,
    client: Optional[object] = None,
    model: Optional[str] = None,
) -> ResumeData:
    """
    Sends factual draft resume evidence and target job analysis to Gemini to refine wording
    into active-verb bullet points and synthesize a targeted summary.

    If Gemini is unconfigured, unavailable, or fails validation, gracefully falls back
    to the original factual draft resume without crashing.
    """
    try:
        active_client = client or get_gemini_client()
    except GeminiConfigurationException as e:
        logger.warning(f"Gemini client unconfigured for resume writing fallback: {e}")
        return draft
    except Exception as e:
        logger.warning(f"Failed to obtain Gemini client: {e}")
        return draft

    active_model = model or settings.GEMINI_MODEL

    job_analysis_summary = (
        f"Role Domain: {job_analysis.domain or 'N/A'}, Seniority: {job_analysis.seniority or 'N/A'}\n"
        f"Required Skills: {', '.join(job_analysis.required_skills or [])}\n"
        f"Technologies: {', '.join(job_analysis.technologies or [])}\n"
        f"Summary: {job_analysis.summary or ''}"
    )

    try:
        response = active_client.models.generate_content(
            model=active_model,
            contents=format_resume_writer_prompt(
                draft_resume_json=draft.model_dump_json(indent=2),
                job_analysis_summary=job_analysis_summary,
            ),
            config=types.GenerateContentConfig(
                system_instruction=RESUME_WRITER_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ResumeData,
                temperature=0.2,
            ),
        )

        if not response or not getattr(response, "text", None):
            logger.warning("Gemini returned an empty response for resume writing. Using factual fallback.")
            return draft

        refined_data = ResumeData.model_validate_json(response.text)

        # Preserve exact fixed fields from factual draft (contact, education IDs/names) to guarantee safety
        refined_data.contact = draft.contact
        refined_data.education = draft.education

        return refined_data

    except Exception as e:
        logger.warning(
            f"Gemini API or validation error during resume wording refinement ({type(e).__name__}: {e}). "
            "Falling back to original factual Career Vault descriptions."
        )
        return draft
