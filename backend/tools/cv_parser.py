"""Best-effort text extraction for uploaded CVs. Never logs file contents."""

from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree

MAX_RESUME_BYTES = 10 * 1024 * 1024
MAX_EXTRACTED_CHARS = 100_000

ALLOWED_SUFFIXES = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".odt",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


def safe_filename(name: str | None) -> str:
    """Keep only the base name so a path cannot be stored."""
    raw = (name or "resume").replace("\x00", "")
    base = Path(raw).name.strip() or "resume"
    return base[:180]


def resume_kind(filename: str, data: bytes) -> str | None:
    """Return a supported suffix, including files whose browser type is missing."""
    suffix = Path(filename).suffix.lower()
    if suffix in ALLOWED_SUFFIXES:
        return suffix
    if data.startswith(b"%PDF"):
        return ".pdf"
    if data.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                names = set(archive.namelist())
        except zipfile.BadZipFile:
            names = set()
        if "word/document.xml" in names:
            return ".docx"
        if "content.xml" in names:
            return ".odt"
    if data.startswith(b"{\\rtf"):
        return ".rtf"
    return None


def extract_resume_text(kind: str, data: bytes) -> str:
    """Pull visible text when the format allows it. Images are accepted without OCR."""
    try:
        if kind == ".pdf":
            text = _pdf_text(data)
        elif kind == ".docx":
            text = _xml_text(data, "word/document.xml")
        elif kind == ".odt":
            text = _xml_text(data, "content.xml")
        elif kind == ".rtf":
            text = _rtf_text(data)
        elif kind == ".txt":
            text = data.decode("utf-8", errors="ignore")
        elif kind == ".doc":
            text = _binary_doc_text(data)
        else:
            text = ""
    except Exception:
        text = ""
    compact = re.sub(r"\s+", " ", text).strip()
    return compact[:MAX_EXTRACTED_CHARS]


def _pdf_text(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _xml_text(data: bytes, member: str) -> str:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        xml = archive.read(member)
    root = ElementTree.fromstring(xml)
    parts = [node.text or "" for node in root.iter() if node.text]
    return "\n".join(parts)


def _rtf_text(data: bytes) -> str:
    raw = data.decode("latin-1", errors="ignore")
    raw = re.sub(r"\\'[0-9a-fA-F]{2}", " ", raw)
    raw = re.sub(r"\\[a-zA-Z]+-?\d* ?", " ", raw)
    return raw.replace("{", " ").replace("}", " ")


def _binary_doc_text(data: bytes) -> str:
    utf16 = data.decode("utf-16le", errors="ignore")
    chunks = re.findall(r"[A-Za-z0-9][A-Za-z0-9 ,.&/+#()\-]{3,}", utf16)
    if len(chunks) >= 5:
        return " ".join(chunks)
    latin = data.decode("latin-1", errors="ignore")
    return " ".join(re.findall(r"[A-Za-z0-9][A-Za-z0-9 ,.&/+#()\-]{3,}", latin))
