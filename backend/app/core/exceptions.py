from typing import Any
from fastapi import Request, status
from fastapi.responses import JSONResponse


class EntityNotFoundException(Exception):
    def __init__(self, entity_name: str, entity_id: Any):
        self.entity_name = entity_name
        self.entity_id = entity_id
        self.message = f"{entity_name} with id '{entity_id}' not found"
        super().__init__(self.message)


class EntityAlreadyExistsException(Exception):
    def __init__(self, entity_name: str, field: str, value: Any):
        self.entity_name = entity_name
        self.field = field
        self.value = value
        self.message = f"{entity_name} with {field} '{value}' already exists"
        super().__init__(self.message)


class ValidationException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class JobAnalysisMissingException(Exception):
    def __init__(self, job_id: Any):
        self.job_id = job_id
        self.message = f"Job with id '{job_id}' does not have a JD analysis. Matching requires a structured analysis."
        super().__init__(self.message)


def entity_not_found_handler(request: Request, exc: EntityNotFoundException) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.message},
    )


def entity_already_exists_handler(request: Request, exc: EntityAlreadyExistsException) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.message},
    )


def validation_exception_handler(request: Request, exc: ValidationException) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.message},
    )


def job_analysis_missing_handler(request: Request, exc: JobAnalysisMissingException) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message},
    )

