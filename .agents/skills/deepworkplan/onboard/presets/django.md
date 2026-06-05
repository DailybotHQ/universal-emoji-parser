# Preset — Django / DRF (Python)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `manage.py` at the repo root and a `settings.py` (often under a project
  package or `config/`/`settings/` split into `base.py`/`local.py`/`prod.py`).
- `Django` in `pyproject.toml` / `requirements.txt`; DRF via `djangorestframework`.
- Package manager from the lockfile: `poetry.lock` → Poetry, `Pipfile.lock` →
  Pipenv, bare `requirements.txt` → pip/venv. **Infer from the lockfile present.**
- App layout: an `apps/` or top-level set of Django apps, each with
  `models.py`, `views.py`, `serializers.py`, `urls.py`, `admin.py`, `migrations/`.
- Frequently containerized: look for `Dockerfile`, `docker-compose.yml`, a
  `docker.sh` helper, and Celery/Redis/Postgres services.

## What to look for in recon

- The **real** test runner: `pytest` (`pytest.ini`/`pyproject [tool.pytest]`) vs
  Django's `manage.py test`. Test file naming is commonly `*_test.py` or
  `tests/test_*.py` — confirm which.
- The **real** lint/format/typecheck gate: `ruff`, `flake8`, `black`, `isort`,
  `mypy` — and whether it's wrapped (e.g. a `codecheck` script) and whether it
  **runs inside a Docker container** (very common for Django here — flag it).
- Migration workflow (`makemigrations` / `migrate`), and whether migrations run
  in the container.
- Settings split and where **secrets** live (`.env`, a settings module, a vault).

## Stack-specific skills/agents/commands to generate

- Skills: `model-add` (add a model + migration), `migration` (make/apply
  migrations safely), `drf-endpoint` (serializer + viewset + URL), optionally
  `management-command` and `celery-task` if Celery is present.
- Agents: baseline roles + a `migration-author` / `db-reviewer` persona aware of
  migration safety.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — app boundaries, request → view → serializer → model flow,
  async/Celery, caching/Redis, DB.
- `TESTING_GUIDE.md` — pytest vs Django test runner, fixtures/factories, the real
  `*_test.py` pattern, how to scope a single app's tests.
- `SECURITY.md` — settings/secrets handling, auth model (sessions/JWT/DRF auth),
  PII boundaries.
- Per-module docs: one per Django **app** (its models, endpoints, signals,
  tasks).

## Typical validation command (FIND the real one)

Often a wrapped, **Dockerized** gate, e.g. `codecheck -f` run *inside* the
container (`bash docker.sh bash <service>`), or `poetry run ruff check && poetry
run pytest`. **Do not assume** — read the Makefile/`docker.sh`/CI and capture the
exact command, flagging that it runs inside Docker if so.
