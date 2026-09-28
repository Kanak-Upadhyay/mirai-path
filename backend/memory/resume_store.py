"""Session-scoped resume text. Cleared from memory when the user removes it."""

from threading import Lock

_lock = Lock()
_resumes: dict[str, str] = {}


def save_resume(session_id: str, text: str) -> None:
    with _lock:
        _resumes[session_id] = text


def get_resume(session_id: str) -> str:
    with _lock:
        return _resumes.get(session_id, "")


def clear_resume(session_id: str) -> None:
    with _lock:
        _resumes.pop(session_id, None)
