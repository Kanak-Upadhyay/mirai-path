"""Turn a career search into ranked public job references."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re

import httpx

from backend.memory.resume_store import get_resume
from backend.services.job_matcher import match_skills
from backend.tools.job_search import SearchHit, collect_hits
from backend.tools.page_reader import USER_AGENT, PageSkip, read_public_page
from backend.tools.skill_extractor import skills_from_list, skills_from_text

logger = logging.getLogger("mirai_path")

_CITY_ALIASES = {
    "bangalore": ("bangalore", "bengaluru"),
    "bengaluru": ("bengaluru", "bangalore"),
    "mumbai": ("mumbai", "bombay"),
    "gurgaon": ("gurgaon", "gurugram"),
    "gurugram": ("gurugram", "gurgaon"),
    "delhi": ("delhi", "new delhi"),
    "noida": ("noida",),
    "pune": ("pune",),
    "hyderabad": ("hyderabad",),
    "chennai": ("chennai", "madras"),
    "kolkata": ("kolkata", "calcutta"),
}


async def research_jobs(
    *,
    role: str,
    location: str,
    skills: str,
    session_id: str,
) -> dict[str, object]:
    """Search public boards and job-site links, then compare them with the resume."""
    logger.info("SEARCH_STARTED")
    hits, notes = await collect_hits(role, location)
    resume = get_resume(session_id)
    candidate = _unique(skills_from_list(skills) + skills_from_text(resume))
    ranked = sorted(hits, key=lambda hit: _preliminary_score(hit, role, location, candidate), reverse=True)
    shortlist = _mix_sources(ranked, limit=8)
    await _read_top_pages(shortlist)
    shortlist.sort(key=lambda hit: _preliminary_score(hit, role, location, candidate), reverse=True)
    jobs = [_to_job(hit, role, location, candidate) for hit in shortlist]
    logger.info("SEARCH_COMPLETED results=%s", len(jobs))
    notice = _notice(jobs, notes)
    return {"jobs": jobs[:8], "notice": notice}


async def _read_top_pages(hits: list[SearchHit]) -> list[SearchHit]:
    timeout = httpx.Timeout(8.0, connect=5.0)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}
    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        await asyncio.gather(
            *(_fill_page(client, hit) for hit in hits if not hit.description),
            return_exceptions=True,
        )
    return hits


async def _fill_page(client: httpx.AsyncClient, hit: SearchHit) -> None:
    try:
        title, text = await read_public_page(client, hit.url)
    except PageSkip as exc:
        hit.notes.append(exc.reason)
        return
    except httpx.HTTPError:
        hit.notes.append("The job page could not be opened.")
        return
    if title and len(title) > len(hit.title):
        hit.title = title[:180]
    hit.description = text


def _to_job(hit: SearchHit, role: str, location: str, candidate: list[str]) -> dict[str, object]:
    blob = " ".join(part for part in (hit.title, hit.snippet, hit.description, hit.location) if part)
    job_skills = skills_from_text(blob)
    compared = match_skills(job_skills, candidate)
    page_note = hit.notes[0] if hit.notes else ""
    explanation = str(compared["explanation"])
    if page_note:
        explanation = f"{explanation} {page_note} Details below are limited to the public search result."
    return {
        "id": hashlib.sha1(hit.url.encode("utf-8")).hexdigest()[:12],
        "title": hit.title or role,
        "company": hit.company or _company_from_title(hit.title),
        "location": _location_from_text(blob, location) or hit.location or "Not specified",
        "employmentType": hit.employment_type or _employment(blob),
        "experience": _experience(blob),
        "salary": hit.salary or _salary(blob),
        "skills": job_skills[:12],
        "url": hit.url,
        "source": hit.source,
        "compatibilityScore": compared["compatibility_score"],
        "matchedSkills": compared["matched_skills"],
        "missingSkills": compared["missing_skills"],
        "partialSkills": compared["partial_skills"],
        "explanation": explanation,
    }


def _preliminary_score(hit: SearchHit, role: str, location: str, candidate: list[str]) -> int:
    blob = f"{hit.title} {hit.snippet} {hit.description} {hit.location}".lower()
    score = 0
    for token in re.split(r"\W+", role.lower()):
        if len(token) < 3:
            continue
        score += 5 if token in hit.title.lower() else 2 if token in blob else 0
    if location and _location_from_text(blob, location):
        score += 6
    for skill in candidate:
        if skill.lower() in blob:
            score += 2
    if hit.description:
        score += 1
    if _directory_page(hit):
        score -= 12
    return score


def _location_from_text(text: str, hinted: str) -> str:
    lowered = text.lower()
    hint = hinted.strip().lower()
    aliases = _CITY_ALIASES.get(hint, (hint,) if hint else ())
    for alias in aliases:
        if alias and alias in lowered:
            return hinted.strip() or alias.title()
    return ""


def _company_from_title(title: str) -> str:
    cleaned = re.sub(r"\s+\|.*$", "", title).strip()
    match = re.search(r"\bat\s+([A-Z][\w&.' -]{1,60})$", cleaned)
    if match:
        return match.group(1).strip()
    hiring = re.split(r"\s+hiring\s+", cleaned, maxsplit=1, flags=re.I)
    if len(hiring) == 2 and hiring[0].strip():
        return hiring[0].strip()
    return "Not specified"


def _experience(text: str) -> str:
    match = re.search(r"\b\d+\s*(?:\+|to|-|–)\s*\d*\s*years?\b", text, flags=re.I)
    if match:
        return match.group(0)
    match = re.search(r"\b\d+\s*\+?\s*years?\b", text, flags=re.I)
    return match.group(0) if match else "Not specified"


def _salary(text: str) -> str:
    match = re.search(
        r"(₹\s?[\d,.]+\s*(?:lpa|lakh|lakhs)?|[\d.]+\s*(?:lpa|lakhs?)\b|\$\s?[\d,.]+\s*[kK]?)",
        text,
        flags=re.I,
    )
    return match.group(0).strip() if match else "Not specified"


def _employment(text: str) -> str:
    lowered = text.lower()
    kinds = []
    if "full-time" in lowered or "full time" in lowered:
        kinds.append("Full-time")
    if "contract" in lowered:
        kinds.append("Contract")
    if "internship" in lowered or re.search(r"\bintern\b", lowered):
        kinds.append("Internship")
    if "remote" in lowered:
        kinds.append("Remote")
    return " · ".join(kinds) if kinds else "Not specified"


def _directory_page(hit: SearchHit) -> bool:
    """Search-result index pages are weaker than a single public posting."""
    blob = f"{hit.title} {hit.url}".lower()
    markers = ("vacancies", "000+", "jobs in ", "srch_", "/q-", "jobs-in-")
    return any(marker in blob for marker in markers)


def _mix_sources(hits: list[SearchHit], limit: int) -> list[SearchHit]:
    """Keep the strongest listing from each job site before filling the rest."""
    picked: list[SearchHit] = []
    seen: set[str] = set()
    for hit in hits:
        if hit.source in seen:
            continue
        picked.append(hit)
        seen.add(hit.source)
        if len(picked) >= limit:
            return picked
    for hit in hits:
        if hit in picked:
            continue
        picked.append(hit)
        if len(picked) >= limit:
            break
    return picked


def _notice(jobs: list[dict[str, object]], notes: list[str]) -> str:
    base = (
        "References are public listings from job sites such as Naukri, LinkedIn, Indeed, "
        "Foundit, and open job boards. Pages that require a login were skipped, and missing "
        "salary or experience is left as Not specified."
    )
    if not jobs:
        return "No public listings matched that search. " + base
    extra = " ".join(dict.fromkeys(notes))
    return f"{base} {extra}".strip()


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered
