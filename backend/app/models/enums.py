import enum


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
