# CLAUDE.md

## Project

DBA-Nexus is an internal DBA team inventory management application.

Phase 1 focuses on:

* Database / RDS inventory
* EC2 inventory
* Application inventory
* Team inventory
* User, role, and permission management
* Controlled access to stored database passwords and SSH private keys

## Tech Stack

* Backend: Python FastAPI
* Frontend: React
* Database: PostgreSQL
* Runtime: Docker Compose

## Default Admin User

The first version must seed a default super admin user:

* Username: admin
* Password: set via `INITIAL_ADMIN_PASSWORD` in `.env`

This is for the initial internal Phase 1 version only.

## Security Notes

Secrets are stored in PostgreSQL for Phase 1.

Do not expose secrets in list APIs.

Secrets must be masked by default in the UI.

Only users with the correct permission can reveal or copy:

* Database admin passwords
* Database user passwords
* EC2 SSH private keys

Application login passwords must be hashed.

## Behavioral Guidelines to Reduce Common LLM Coding Mistakes

These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

* State your assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them. Do not pick silently.
* If a simpler approach exists, say so. Push back when warranted.
* If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

* No features beyond what was asked.
* No abstractions for single-use code.
* No flexibility or configurability that was not requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.
* Ask yourself: would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

* Do not improve adjacent code, comments, or formatting.
* Do not refactor things that are not broken.
* Match existing style, even if you would do it differently.
* If you notice unrelated dead code, mention it, but do not delete it.

When your changes create orphans:

* Remove imports, variables, and functions that your changes made unused.
* Do not remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

* "Add validation" means write tests for invalid inputs, then make them pass.
* "Fix the bug" means write a test that reproduces it, then make it pass.
* "Refactor X" means ensure tests pass before and after.

For multi-step tasks, state a brief plan:

1. Step → verify: check
2. Step → verify: check
3. Step → verify: check

Strong success criteria let you loop independently. Weak criteria like "make it work" require constant clarification.

These guidelines are working if there are fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Coding Rules for This Project

* Prefer simple, readable code.
* Avoid speculative abstractions.
* Do not add SSO, AWS integration, Vault, AWS Secrets Manager, or KMS in Phase 1.
* Do not add Kubernetes.
* Do not add CI/CD unless explicitly requested.
* Do not add multi-tenant support unless explicitly requested.
* Keep Docker Compose local-development friendly.
* Keep README accurate and updated.
* Make sure `docker compose up --build` works.

## Ports

* postgres: 5432
* backend: 3000
* frontend: 8080

## Permissions Model

Permissions are named capabilities stored in the `permissions` table:

* `can_read_inventory` — view lists and detail pages
* `can_write_inventory` — create, update, delete records
* `can_view_secrets` — reveal passwords and SSH keys
* `can_manage_users` — manage users and roles

Roles are assigned a set of permissions via `role_permissions`. Role checks use `require_permission("permission_name")` in `app/core/deps.py`.

## Secret Handling

Secrets (database passwords, SSH keys) are Fernet-encrypted before storage.

The encryption key is `APP_SECRET_ENCRYPTION_KEY` in the environment.

Generate a key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

Secret endpoints are at `/api/databases/{id}/secret`, `/api/databases/{id}/users/{uid}/secret`, and `/api/ec2/{id}/secret`. They require `can_view_secrets`.

## Known Gotchas & Environment Quirks

### bcrypt version pin
`bcrypt` must be pinned to `==4.0.1` in `requirements.txt`. bcrypt 4.x is the last version compatible with passlib 1.7.4. Do not upgrade bcrypt — it will break password hashing at runtime.

### Frontend file sync in Docker
`frontend/src/` is mounted as a live volume — edits hot-reload automatically via Vite.
Files outside `src/` (e.g. `package.json`, `vite.config.ts`) are baked into the image; use `./docker.sh rebuild` after changing them.
To push a one-off file without rebuilding: `docker compose cp <local> frontend:/app/<path>`

### Backend always requires rebuild
Backend Python files are copied into the image at build time. Any change to `backend/` requires `./docker.sh rebuild` — there is no volume mount for the backend.

### Fernet key stability
`APP_SECRET_ENCRYPTION_KEY` must be set and stable across restarts. If unset, a temporary key is generated once per process startup — secrets encrypted in one run cannot be decrypted after a restart. Always set this variable before storing real secrets.

### Test database setup
Pytest requires a separate database. Create it once before running tests:
`docker compose exec postgres psql -U postgres -c "CREATE DATABASE dba_nexus_test;"`
Then run: `docker compose run --rm backend pytest tests/ -v`

### Large implementation plans hit token limits
Plans for this project are too large for a single response (~32k token limit). Split into phases: backend first, then frontend core, then pages.
