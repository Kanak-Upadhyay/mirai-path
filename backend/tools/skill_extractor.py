"""Find and normalize skills mentioned in a resume or a public job listing."""

from __future__ import annotations

import re

# Longer names are checked first so "Node.js" wins over a shorter fragment.
_CANONICAL = [
    "Amazon Web Services",
    "Google Cloud",
    "Power BI",
    "CI/CD",
    "Node.js",
    "PostgreSQL",
    "JavaScript",
    "TypeScript",
    "Kubernetes",
    "Terraform",
    "Snowflake",
    "LangGraph",
    "LangChain",
    "FastAPI",
    "MongoDB",
    "MySQL",
    "GraphQL",
    "Selenium",
    "Airflow",
    "Django",
    "Flask",
    "Pandas",
    "Spark",
    "Docker",
    "Python",
    "React",
    "Angular",
    "Java",
    "Kafka",
    "Redis",
    "Azure",
    "Linux",
    "Excel",
    "Tableau",
    "dbt",
    "SQL",
    "ETL",
    "AWS",
    "GCP",
    "Git",
    "Go",
    "REST",
]

_ALIASES = {
    "amazon web services": "AWS",
    "google cloud": "GCP",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "react.js": "React",
    "reactjs": "React",
    "powerbi": "Power BI",
    "power bi": "Power BI",
    "k8s": "Kubernetes",
    "ci/cd": "CI/CD",
    "golang": "Go",
    "js": "JavaScript",
    "ts": "TypeScript",
}

RELATED: dict[str, set[str]] = {
    "Cloud": {"AWS", "Azure", "GCP"},
    "AWS": {"Cloud"},
    "Azure": {"Cloud"},
    "GCP": {"Cloud"},
    "SQL": {"PostgreSQL", "MySQL"},
    "PostgreSQL": {"SQL"},
    "MySQL": {"SQL"},
}


def skills_from_text(text: str) -> list[str]:
    """Return canonical skills that actually appear in the text."""
    if not text:
        return []
    haystack = text.lower()
    found: list[str] = []
    seen: set[str] = set()
    for name in sorted(_CANONICAL, key=len, reverse=True):
        token = name.lower()
        if re.search(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])", haystack):
            canonical = _ALIASES.get(token, name)
            if canonical not in seen:
                seen.add(canonical)
                found.append(canonical)
    if re.search(r"(?<![a-z0-9])cloud(?![a-z0-9])", haystack) and "Cloud" not in seen:
        found.append("Cloud")
    return found


def skills_from_list(raw: str) -> list[str]:
    """Normalize a comma-separated skill field without inventing extras."""
    found: list[str] = []
    seen: set[str] = set()
    for piece in re.split(r"[,/|]", raw):
        cleaned = piece.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        canonical = _ALIASES.get(key)
        if canonical is None:
            match = next((name for name in _CANONICAL if name.lower() == key), None)
            canonical = match or cleaned
        if canonical not in seen:
            seen.add(canonical)
            found.append(canonical)
    return found
