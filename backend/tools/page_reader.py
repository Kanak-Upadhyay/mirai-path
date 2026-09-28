"""Fetch publicly readable job pages. Login walls and blocked hosts are skipped."""

from __future__ import annotations

import ipaddress
import socket
from html.parser import HTMLParser
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

USER_AGENT = "MIRAI-PATH/0.1 (public career research)"
_MAX_BYTES = 400_000
_ROBOTS: dict[str, RobotFileParser | None] = {}
_SKIP_MARKERS = (
    "authwall",
    "sign in to linkedin",
    "join linkedin",
    "captcha",
    "access denied",
    "enable javascript to view",
)


class PageSkip(Exception):
    """The page cannot be used. The caller should keep the search link only."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


class _TextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.title_parts: list[str] = []
        self._skip = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self._skip += 1
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip:
            self._skip -= 1
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        if self._in_title:
            self.title_parts.append(data)
        else:
            self.parts.append(data)


def _is_public_host(hostname: str) -> bool:
    if not hostname or hostname.endswith((".local", ".internal")):
        return False
    try:
        addresses = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise PageSkip("The job link could not be resolved.") from exc
    for info in addresses:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise PageSkip("The job link is not a public address.")
    return True


def public_job_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    path = parsed.path.lower()
    if host.endswith("linkedin.com") and "/jobs" not in path:
        return False
    blocked = ("duckduckgo.com", "google.", "wikipedia.org", "youtube.com", "facebook.com")
    return not any(piece in host for piece in blocked)


async def read_public_page(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    """Return title and visible text, or raise PageSkip with a short reason."""
    if not public_job_url(url):
        raise PageSkip("That link is not a public job page.")
    current = url
    for _ in range(4):
        parsed = urlparse(current)
        hostname = parsed.hostname or ""
        _is_public_host(hostname)
        if not await _robots_allows(client, current):
            raise PageSkip("The site's robots rules do not allow this page.")
        response = await client.get(current, follow_redirects=False)
        if response.status_code in {301, 302, 303, 307, 308}:
            target = response.headers.get("location")
            if not target:
                raise PageSkip("The job page redirected without a destination.")
            current = str(httpx.URL(current).join(target))
            continue
        if response.status_code in {401, 403, 429}:
            raise PageSkip("The job page asked for a login or refused the request.")
        if response.status_code >= 400:
            raise PageSkip(f"The job page returned status {response.status_code}.")
        body = response.content[:_MAX_BYTES]
        parser = _TextParser()
        parser.feed(body.decode(response.encoding or "utf-8", errors="ignore"))
        title = " ".join("".join(parser.title_parts).split())
        text = " ".join("".join(parser.parts).split())
        sample = text[:1500].lower()
        if len(text) < 400 and any(marker in sample for marker in _SKIP_MARKERS):
            raise PageSkip("The job page is behind a login wall.")
        return title[:200], text[:8000]
    raise PageSkip("The job page redirected too many times.")


async def _robots_allows(client: httpx.AsyncClient, url: str) -> bool:
    hostname = urlparse(url).hostname or ""
    if hostname in _ROBOTS:
        cached = _ROBOTS[hostname]
        return True if cached is None else cached.can_fetch(USER_AGENT, url)
    robots_url = f"{urlparse(url).scheme}://{hostname}/robots.txt"
    try:
        response = await client.get(robots_url)
    except httpx.HTTPError:
        _ROBOTS[hostname] = None
        return True
    if response.status_code >= 400:
        _ROBOTS[hostname] = None
        return True
    parser = RobotFileParser()
    parser.parse(response.text.splitlines())
    _ROBOTS[hostname] = parser
    return parser.can_fetch(USER_AGENT, url)
