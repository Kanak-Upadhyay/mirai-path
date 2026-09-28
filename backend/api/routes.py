"""Public HTTP routes for MIRAI PATH."""

import logging

from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from backend.memory.resume_store import clear_resume, save_resume
from backend.models.schemas import HealthResponse, ResearchRequest, ResearchResponse, ResumeUploadResponse
from backend.services.research import research_jobs
from backend.tools.cv_parser import (
    MAX_RESUME_BYTES,
    extract_resume_text,
    resume_kind,
    safe_filename,
)

logger = logging.getLogger("mirai_path")

router = APIRouter()


@router.get("/", tags=["system"])
def root() -> dict[str, str]:
    """Identify the service and point clients at health and API docs."""
    return {
        "name": "MIRAI PATH",
        "meaning": "FUTURE + PATH",
        "health": "/api/health",
        "docs": "/docs",
    }


@router.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["system"],
    summary="Service health",
)
def health() -> HealthResponse:
    """Report that the API process is up. Does not call an LLM or database."""
    return HealthResponse(status="ok", service="mirai-path")


@router.post(
    "/api/upload-resume",
    response_model=ResumeUploadResponse,
    tags=["resume"],
    summary="Accept a CV for this session",
)
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = Header(default="", alias="X-Session-Id"),
) -> ResumeUploadResponse:
    """Store a CV for the browser session. Resume text is not written to logs."""
    payload = await file.read(MAX_RESUME_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="That file is empty.")
    if len(payload) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=400, detail="That CV is larger than 10 MB.")

    filename = safe_filename(file.filename)
    kind = resume_kind(filename, payload)
    if kind is None:
        raise HTTPException(
            status_code=400,
            detail="Use a PDF, Word document, text file, or a photo of your CV.",
        )

    text = extract_resume_text(kind, payload)
    save_resume(_session_key(session_id), text)
    logger.info("RESUME_ACCEPTED kind=%s bytes=%s chars=%s", kind, len(payload), len(text))
    return ResumeUploadResponse(accepted=True, filename=filename, characters=len(text))


@router.delete("/api/upload-resume", tags=["resume"], summary="Remove the session CV")
def remove_resume(session_id: str = Header(default="", alias="X-Session-Id")) -> dict[str, bool]:
    """Drop the CV kept for this browser session."""
    clear_resume(_session_key(session_id))
    logger.info("RESUME_CLEARED")
    return {"cleared": True}


@router.post(
    "/api/research",
    response_model=ResearchResponse,
    tags=["research"],
    summary="Search public job listings",
)
async def research(
    body: ResearchRequest,
    session_id: str = Header(default="", alias="X-Session-Id"),
) -> ResearchResponse:
    """Find public listings across job sites and compare them with this session's CV."""
    try:
        payload = await research_jobs(
            role=body.role,
            location=body.location,
            skills=body.skills,
            session_id=_session_key(session_id),
        )
    except Exception:
        logger.exception("SEARCH_FAILED")
        raise HTTPException(
            status_code=502,
            detail="Job sites could not be reached. Try again in a moment.",
        ) from None
    return ResearchResponse.model_validate(payload)


def _session_key(session_id: str) -> str:
    cleaned = session_id.strip() or "anonymous"
    return cleaned[:80]
