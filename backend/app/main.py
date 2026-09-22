from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    EntityNotFoundException,
    EntityAlreadyExistsException,
    ValidationException,
    JobAnalysisMissingException,
    GeminiConfigurationException,
    GeminiServiceException,
    entity_not_found_handler,
    entity_already_exists_handler,
    validation_exception_handler,
    job_analysis_missing_handler,
    gemini_configuration_handler,
    gemini_service_handler,
)

app = FastAPI(
    title="Risumd Career Vault API",
    description="Backend API for Risumd Career Vault - Personal career management and tailored resume foundation",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers
app.add_exception_handler(EntityNotFoundException, entity_not_found_handler)
app.add_exception_handler(EntityAlreadyExistsException, entity_already_exists_handler)
app.add_exception_handler(ValidationException, validation_exception_handler)
app.add_exception_handler(JobAnalysisMissingException, job_analysis_missing_handler)
app.add_exception_handler(GeminiConfigurationException, gemini_configuration_handler)
app.add_exception_handler(GeminiServiceException, gemini_service_handler)



# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"], summary="Service Health Check")
def health_check():
    return {"status": "ok"}
