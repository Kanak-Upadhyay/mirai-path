# MIRAI PATH

**MIRAI PATH = FUTURE + PATH**

Mirai (未来) means **Future** in Japanese. Path is a person's career journey.

MIRAI PATH is an AI-powered job research and application agent: it is meant to research public job pages, compare them with a resume, show skill gaps, and draft application materials.

## Status

This repository is at **Phase 1 — setup**.

What runs today:

- Python configuration from environment variables
- FastAPI service with `GET /api/health`, `/docs`, and `/redoc`
- Next.js application shell branded as MIRAI PATH

The LangGraph workflow, job search, page reader, resume parsing, matching, memory, and full product UI are not in this phase.

## Stack so far

- Python 3.11+
- FastAPI, Pydantic, Uvicorn
- Next.js, TypeScript, Tailwind CSS

Planned in later phases: LangGraph, OpenAI and Gemini, ChromaDB, PostgreSQL, pytest, and Docker.

## Project structure

```text
backend/          FastAPI app, config, and empty packages for later phases
frontend/         Next.js shell
evals/            Reserved for the evaluation suite
tests/            Reserved for pytest
data/             Local data directory (Chroma contents are gitignored)
.env.example      Backend environment template
requirements.txt
```

The git repository root is this project. The on-disk folder name can differ from the product name. The product name is always **MIRAI PATH**.

## Setup

From the repository root.

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn backend.main:app --reload
```

macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --reload
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000)

## Health check

```http
GET /api/health
```

```json
{
  "status": "ok",
  "service": "mirai-path"
}
```

The health check does not call an LLM, search provider, or database. Missing API keys do not stop the process.

## Environment variables

Copy `.env.example` to `.env`. Leave secrets empty until a later phase needs them.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI credential, backend only |
| `GEMINI_API_KEY` | Gemini credential, backend only |
| `LLM_PROVIDER` | `openai` or `gemini` |
| `SEARCH_API_KEY` | Search credential, backend only |
| `SEARCH_PROVIDER` | Search provider name |
| `DATABASE_URL` | PostgreSQL URL, when persistence is added |
| `CHROMA_PATH` | Local Chroma directory |
| `FRONTEND_URL` | Browser origin allowed by CORS |
| `BACKEND_URL` | Public backend origin shown in API docs |

Frontend only, in `frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend origin the browser may call |

Do not put `OPENAI_API_KEY`, `GEMINI_API_KEY`, `SEARCH_API_KEY`, or `DATABASE_URL` in any `NEXT_PUBLIC_` variable.

## Security notes for this phase

- `.env` is gitignored. Commit `.env.example` only.
- API keys are loaded as secrets and are not written in startup logs.
- CORS allows the configured `FRONTEND_URL` only.

## Next phase

Phase 2 adds the LangGraph state, graph, nodes, and an LLM provider abstraction.
