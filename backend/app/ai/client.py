from typing import Optional
from google import genai

from app.core.config import settings
from app.core.exceptions import GeminiConfigurationException


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """
    Initializes and returns a Google GenAI Client.
    Raises GeminiConfigurationException if the API key is not set.
    """
    key = api_key or settings.GEMINI_API_KEY
    if not key or not str(key).strip():
        raise GeminiConfigurationException(
            "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file or environment."
        )

    return genai.Client(api_key=str(key).strip())
