"""API schemas. Only the health contract exists in this phase."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness payload for GET /api/health."""

    status: str = Field(examples=["ok"])
    service: str = Field(examples=["mirai-path"])


class ResearchRequest(BaseModel):
    """What the workspace sends when the user starts research."""

    role: str = Field(min_length=1, max_length=160)
    location: str = ""
    experience: str = ""
    skills: str = ""
    jobType: str = "Any"
    salary: str = ""
    preferences: str = ""


class JobResultOut(BaseModel):
    """One public listing, with an estimated skill overlap."""

    id: str
    title: str
    company: str
    location: str
    employmentType: str
    experience: str
    salary: str
    skills: list[str]
    url: str
    source: str
    compatibilityScore: int | None
    matchedSkills: list[str]
    missingSkills: list[str]
    partialSkills: list[str]
    explanation: str


class ResearchResponse(BaseModel):
    jobs: list[JobResultOut]
    notice: str = ""


class ResumeUploadResponse(BaseModel):
    """Confirmation that a CV was accepted for this session."""

    accepted: bool = True
    filename: str
    characters: int = Field(description="How much text could be read. Images may be 0.")
