"""Collect public job references from open boards and public web search."""

from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from urllib.parse import parse_qs, unquote, urlparse

import httpx

from backend.tools.page_reader import USER_AGENT, public_job_url

logger = logging.getLogger("mirai_path")

_HEADERS = {"User-Agent": USER_AGENT, "Accept": "text/html,application/json"}


@dataclass
class SearchHit:
    title: str
    url: str
    source: str
    snippet: str = ""
    company: str = ""
    location: str = ""
    description: str = ""
    employment_type: str = ""
    salary: str = ""
    notes: list[str] = field(default_factory=list)


class _ResultParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.snippets: list[str] = []
        self._href = ""
        self._parts: list[str] = []
        self._mode = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        classes = attr.get("class", "")
        if tag == "a" and "result__a" in classes:
            self._mode = "link"
            self._href = attr.get("href", "")
            self._parts = []
        elif "result__snippet" in classes:
            self._mode = "snippet"
            self._parts = []

    def handle_endtag(self, tag: str) -> None:
        if self._mode == "link" and tag == "a":
            self.links.append((self._href, " ".join("".join(self._parts).split())))
            self._mode = ""
        elif self._mode == "snippet" and tag in {"a", "td", "div"}:
            self.snippets.append(" ".join("".join(self._parts).split()))
            self._mode = ""

    def handle_data(self, data: str) -> None:
        if self._mode:
            self._parts.append(data)


def build_queries(role: str, location: str) -> list[str]:
    """A few targeted queries. More sites are covered by the open web query."""
    place = location.strip()
    role = role.strip()
    focus = " ".join(part for part in (role, place) if part)
    return [
        f"{focus} jobs",
        f"{focus} site:naukri.com",
        f"{focus} site:linkedin.com/jobs",
        (
            f"{focus} (site:in.indeed.com OR site:foundit.in OR site:shine.com "
            "OR site:instahyre.com OR site:cutshort.io OR site:hirist.tech "
            "OR site:timesjobs.com OR site:wellfound.com OR site:glassdoor.co.in "
            "OR site:internshala.com)"
        ),
    ]


def source_name(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    names = (
        ("naukri.com", "Naukri"),
        ("linkedin.com", "LinkedIn"),
        ("indeed.", "Indeed"),
        ("foundit.in", "Foundit"),
        ("shine.com", "Shine"),
        ("instahyre.com", "Instahyre"),
        ("cutshort.io", "Cutshort"),
        ("hirist.", "Hirist"),
        ("timesjobs.com", "TimesJobs"),
        ("wellfound.com", "Wellfound"),
        ("glassdoor.", "Glassdoor"),
        ("internshala.com", "Internshala"),
        ("remotive.com", "Remotive"),
        ("arbeitnow.com", "Arbeitnow"),
    )
    for needle, label in names:
        if needle in host:
            return label
    return host.removeprefix("www.") or "Public listing"


def unwrap_search_url(href: str) -> str:
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    host = parsed.hostname or ""
    if "duckduckgo.com" in host and parsed.path.startswith("/l/"):
        target = parse_qs(parsed.query).get("uddg", [""])[0]
        return unquote(target)
    return href


async def collect_hits(role: str, location: str) -> tuple[list[SearchHit], list[str]]:
    """Search open job APIs and public web results. Failures are notes, not crashes."""
    notes: list[str] = []
    timeout = httpx.Timeout(8.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout, headers=_HEADERS) as client:
        web_task = _web_hits(client, build_queries(role, location))
        board_task = _board_hits(client, role)
        web, boards = await asyncio.gather(web_task, board_task, return_exceptions=True)

    hits: list[SearchHit] = []
    if isinstance(web, Exception):
        logger.info("WEB_SEARCH_FAILED %s", type(web).__name__)
        notes.append("Public web search did not respond, so those site links are missing.")
    else:
        hits.extend(web[0])
        notes.extend(web[1])
    if isinstance(boards, Exception):
        logger.info("BOARD_SEARCH_FAILED %s", type(boards).__name__)
        notes.append("Open job-board feeds did not respond.")
    else:
        hits.extend(boards)
    return _dedupe(hits), notes


async def _web_hits(
    client: httpx.AsyncClient, queries: list[str]
) -> tuple[list[SearchHit], list[str]]:
    results = await asyncio.gather(*(_duckduckgo(client, query) for query in queries), return_exceptions=True)
    hits: list[SearchHit] = []
    failures = 0
    for result in results:
        if isinstance(result, Exception):
            failures += 1
            continue
        hits.extend(result)
    notes = []
    if failures == len(queries):
        notes.append("Public web search did not return site links for this query.")
    elif failures:
        notes.append("Some job-site searches did not respond. The rest were kept.")
    return hits, notes


async def _duckduckgo(client: httpx.AsyncClient, query: str) -> list[SearchHit]:
    response = await client.post("https://html.duckduckgo.com/html/", data={"q": query})
    if response.status_code >= 400:
        raise httpx.HTTPStatusError("search failed", request=response.request, response=response)
    parser = _ResultParser()
    parser.feed(response.text)
    hits: list[SearchHit] = []
    for index, (href, title) in enumerate(parser.links):
        url = unwrap_search_url(href)
        if not public_job_url(url) or not title:
            continue
        snippet = parser.snippets[index] if index < len(parser.snippets) else ""
        hits.append(SearchHit(title=title[:180], url=url, source=source_name(url), snippet=snippet[:400]))
    return hits


async def _board_hits(client: httpx.AsyncClient, role: str) -> list[SearchHit]:
    remotive, arbeitnow = await asyncio.gather(
        _remotive(client, role),
        _arbeitnow(client, role),
        return_exceptions=True,
    )
    hits: list[SearchHit] = []
    for result in (remotive, arbeitnow):
        if isinstance(result, list):
            hits.extend(result)
    return hits


async def _remotive(client: httpx.AsyncClient, role: str) -> list[SearchHit]:
    response = await client.get("https://remotive.com/api/remote-jobs", params={"search": role})
    response.raise_for_status()
    payload = response.json()
    hits: list[SearchHit] = []
    for job in (payload.get("jobs") or [])[:8]:
        url = str(job.get("url") or "")
        title = str(job.get("title") or "").strip()
        if not url or not title or not public_job_url(url):
            continue
        hits.append(
            SearchHit(
                title=title[:180],
                url=url,
                source="Remotive",
                company=str(job.get("company_name") or "").strip(),
                location=str(job.get("candidate_required_location") or "").strip(),
                description=_plain(str(job.get("description") or ""))[:8000],
                employment_type=str(job.get("job_type") or "").strip(),
                salary=str(job.get("salary") or "").strip(),
            )
        )
    return hits


async def _arbeitnow(client: httpx.AsyncClient, role: str) -> list[SearchHit]:
    response = await client.get("https://www.arbeitnow.com/api/job-board-api")
    response.raise_for_status()
    tokens = [token for token in re.split(r"\W+", role.lower()) if len(token) > 2]
    hits: list[SearchHit] = []
    for job in (response.json().get("data") or [])[:40]:
        blob = f"{job.get('title', '')} {job.get('description', '')}".lower()
        if tokens and not any(token in blob for token in tokens):
            continue
        url = str(job.get("url") or "")
        title = str(job.get("title") or "").strip()
        if not url or not title or not public_job_url(url):
            continue
        kinds = job.get("job_types") or []
        employment = ", ".join(str(kind) for kind in kinds if kind)
        if job.get("remote") and "remote" not in employment.lower():
            employment = f"{employment}, remote".strip(", ")
        hits.append(
            SearchHit(
                title=title[:180],
                url=url,
                source="Arbeitnow",
                company=str(job.get("company_name") or "").strip(),
                location=str(job.get("location") or "").strip(),
                description=_plain(str(job.get("description") or ""))[:8000],
                employment_type=employment,
            )
        )
        if len(hits) >= 8:
            break
    return hits


def _plain(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def _dedupe(hits: list[SearchHit]) -> list[SearchHit]:
    seen: set[str] = set()
    unique: list[SearchHit] = []
    for hit in hits:
        key = hit.url.split("?")[0].rstrip("/").lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(hit)
    return unique
