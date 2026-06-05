# Preset — FastAPI (Python)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `fastapi` in `pyproject.toml` / `requirements.txt`, plus an ASGI server:
  `uvicorn`, or `gunicorn` with `uvicorn.workers.UvicornWorker`.
- An application factory or module-level instance: `app = FastAPI(...)`, often
  in `app/main.py` / `main.py` / `src/<pkg>/main.py`.
- `APIRouter` modules wired in via `app.include_router(...)`, `async def` (and
  some `def`) path operations decorated with `@router.get/post/...`.
- Pydantic models for request/response schemas (Pydantic v1 vs v2 matters), and
  `pydantic-settings`/`BaseSettings` for configuration.
- Dependency injection via `Depends(...)`; common deps for DB sessions, auth,
  and pagination.
- Package manager from the lockfile: `poetry.lock` → Poetry, `uv.lock` → uv,
  `Pipfile.lock` → Pipenv, bare `requirements.txt` → pip/venv. **Infer from the
  lockfile present.**
- Frequently paired with SQLAlchemy + Alembic (`alembic.ini`, `migrations/` or
  `alembic/`), or an async ORM (SQLModel, Tortoise). Often containerized
  (`Dockerfile`, `docker-compose.yml`).

## What to look for in recon

- The **real** test runner: almost always `pytest` (`pytest.ini` /
  `pyproject [tool.pytest.ini_options]`), driving endpoints through Starlette's
  `TestClient` or async `httpx.AsyncClient` with `ASGITransport`. Confirm the
  test layout (`tests/`, `test_*.py`) and any `conftest.py` fixtures.
- The **real** lint/format/typecheck gate: `ruff` (lint + format), `black`,
  `isort`, `mypy`/`pyright` — and whether it's wrapped in a Makefile/script and
  whether it **runs inside Docker** (flag it if so).
- The Pydantic major version (v1 vs v2) — it changes validators, config, and
  serialization patterns the generated skills must follow.
- Sync vs async surface: blocking I/O inside `async def` handlers is a hazard;
  note the DB driver (async vs sync) and the event-loop discipline.
- Router composition (`include_router`, prefixes, tags), the settings/secrets
  layout (`.env`, `BaseSettings`), and the run command (`uvicorn app.main:app`).
- Migration workflow if Alembic is present (`alembic revision --autogenerate`,
  `alembic upgrade head`) and whether it runs in the container.

## Stack-specific skills/agents/commands to generate

- Skills: `router-add` (an `APIRouter` module + handlers + `include_router`
  wiring), `schema` (Pydantic request/response models), `dependency` (a
  `Depends` provider — auth, DB session, pagination), `endpoint` (path operation
  + schema + test), optionally `migration` (Alembic revision) if SQLAlchemy is
  present.
- Agents: baseline roles + an `api-reviewer` / `schema-author` persona aware of
  Pydantic validation, response models, and async/blocking hazards.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — app assembly (`include_router`), request → dependency →
  handler → response-model flow, async vs sync boundaries, DB/session lifecycle.
- `TESTING_GUIDE.md` — `pytest` + `TestClient`/`httpx`, async fixtures, how to
  override dependencies (`app.dependency_overrides`) and scope one router's
  tests.
- `SECURITY.md` — auth scheme (OAuth2/JWT, API keys), `BaseSettings`/secrets
  handling, input validation via Pydantic, CORS.
- Per-module docs: one per router/feature (its schemas, dependencies,
  endpoints).

## Typical validation command (FIND the real one)

Often `ruff check && mypy && pytest`, or a wrapped/Dockerized gate (e.g. `make
check`, or commands run *inside* the container). **Do not assume** the package
manager or script names — read the Makefile/`pyproject.toml`/CI and capture the
exact command, flagging that it runs inside Docker if so.
