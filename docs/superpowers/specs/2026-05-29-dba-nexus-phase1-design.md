# DBA-Nexus Phase 1 Design

Date: 2026-05-29  
Status: Approved

## Overview

DBA-Nexus is an internal DBA team inventory management application. Phase 1 delivers a working local application for managing database/RDS inventory, EC2 server inventory, applications, and teams — with role-based access control and controlled exposure of secrets.

## Architecture

**Approach:** Monorepo with separate backend and frontend containers plus a postgres container. Three services communicate over Docker Compose internal networking.

```
dba-nexus/
  backend/       ← FastAPI + SQLAlchemy + Alembic
  frontend/      ← React + Vite + Tailwind + TanStack Query
  docker-compose.yml
  .env.example
  CLAUDE.md
  README.md
```

**Ports:**

| Service    | Port |
|------------|------|
| postgres   | 5432 |
| backend    | 3000 |
| frontend   | 8080 |

Frontend proxies `/api/*` to `http://backend:3000`. One command to run: `docker compose up --build`.

## Data Model

### Core tables

```
users
  id, username, hashed_password, is_active, role_id, created_at, updated_at

roles
  id, name, description

permissions
  id, name, description

role_permissions (junction)
  role_id, permission_id

databases
  id, name, engine, environment, hostname, port, region, account,
  rds_instance_id, admin_username, admin_password (encrypted at rest),
  description, notes, created_at, updated_at

database_users
  id, database_id, username, password (encrypted at rest), role_purpose, notes

database_applications (junction)
  database_id, application_id

database_teams (junction)
  database_id, team_id

ec2_servers
  id, name, instance_id, environment, private_ip, hostname, region, account,
  operating_system, ssh_username, ssh_private_key (encrypted at rest),
  description, notes, created_at, updated_at

ec2_applications (junction)
  ec2_id, application_id

ec2_teams (junction)
  ec2_id, team_id

applications
  id, name, description, owner_team, notes, created_at, updated_at

teams
  id, name, description, contact, notes, created_at, updated_at
```

### Permissions (named capabilities)

| Permission name        | What it unlocks                                     |
|------------------------|-----------------------------------------------------|
| `can_read_inventory`   | View all inventory lists and detail pages           |
| `can_write_inventory`  | Create, update, delete inventory records            |
| `can_view_secrets`     | Reveal passwords and SSH private keys               |
| `can_manage_users`     | Create, update, delete users and assign roles       |

### Seeded roles

| Role         | Permissions                                                          |
|--------------|----------------------------------------------------------------------|
| Super Admin  | all four                                                             |
| Writer       | `can_read_inventory`, `can_write_inventory`                          |
| Reader       | `can_read_inventory`                                                 |
| Secret Reader| `can_read_inventory`, `can_view_secrets`                             |

### Sensitive fields

- `databases.admin_password`
- `database_users.password`
- `ec2_servers.ssh_private_key`

These fields are **never returned** in list or standard detail APIs. They are only returned from dedicated `/secret` endpoints gated by the `can_view_secrets` permission.

## API Structure

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users                         (can_manage_users)
POST   /api/users                         (can_manage_users)
GET    /api/users/{id}                    (can_manage_users)
PUT    /api/users/{id}                    (can_manage_users)
DELETE /api/users/{id}                    (can_manage_users)

GET    /api/roles                         (can_manage_users)
POST   /api/roles                         (can_manage_users)
PUT    /api/roles/{id}                    (can_manage_users)
DELETE /api/roles/{id}                    (can_manage_users)

GET    /api/databases                     (can_read_inventory)
POST   /api/databases                     (can_write_inventory)
GET    /api/databases/{id}               (can_read_inventory)
PUT    /api/databases/{id}               (can_write_inventory)
DELETE /api/databases/{id}               (can_write_inventory)
GET    /api/databases/{id}/secret        (can_view_secrets)

GET    /api/databases/{id}/users         (can_read_inventory)
POST   /api/databases/{id}/users         (can_write_inventory)
GET    /api/databases/{id}/users/{uid}   (can_read_inventory)
PUT    /api/databases/{id}/users/{uid}   (can_write_inventory)
DELETE /api/databases/{id}/users/{uid}   (can_write_inventory)
GET    /api/databases/{id}/users/{uid}/secret  (can_view_secrets)

GET    /api/ec2                           (can_read_inventory)
POST   /api/ec2                           (can_write_inventory)
GET    /api/ec2/{id}                      (can_read_inventory)
PUT    /api/ec2/{id}                      (can_write_inventory)
DELETE /api/ec2/{id}                      (can_write_inventory)
GET    /api/ec2/{id}/secret               (can_view_secrets)

GET    /api/applications
POST   /api/applications                  (can_write_inventory)
PUT    /api/applications/{id}             (can_write_inventory)
DELETE /api/applications/{id}             (can_write_inventory)

GET    /api/teams
POST   /api/teams                         (can_write_inventory)
PUT    /api/teams/{id}                    (can_write_inventory)
DELETE /api/teams/{id}                    (can_write_inventory)
```

List endpoints support: `?search=`, `?environment=`, `?application_id=`, `?team_id=`

## Backend Layout

```
backend/
  app/
    api/
      auth.py
      users.py
      roles.py
      databases.py
      database_users.py
      ec2.py
      applications.py
      teams.py
    models/
      user.py, role.py, permission.py
      database.py, database_user.py
      ec2.py
      application.py, team.py
    schemas/
      auth.py, user.py, role.py
      database.py, database_user.py
      ec2.py, application.py, team.py
    core/
      config.py      ← settings from env vars
      security.py    ← JWT, password hashing, secret encryption
      deps.py        ← FastAPI dependency injection (current_user, require_permission)
    db/
      session.py
      base.py
  alembic/
  tests/
    test_auth.py
    test_databases.py
    test_ec2.py
    test_permissions.py
  seed.py
  main.py
  Dockerfile
  requirements.txt
```

## Frontend Layout

```
frontend/
  src/
    api/
      client.ts          ← Axios instance with JWT interceptor
      auth.ts
      databases.ts
      ec2.ts
      applications.ts
      teams.ts
      users.ts
      roles.ts
    pages/
      Login.tsx
      Dashboard.tsx
      DatabaseList.tsx
      DatabaseDetail.tsx
      EC2List.tsx
      EC2Detail.tsx
      Applications.tsx
      Teams.tsx
      admin/
        Users.tsx
        Roles.tsx
    components/
      Layout.tsx          ← sidebar + header shell
      Sidebar.tsx
      SecretField.tsx     ← masked field with reveal/copy buttons
      EnvironmentBadge.tsx
      TagList.tsx         ← chips for apps/teams
      ConfirmDialog.tsx
    hooks/
      useAuth.ts
      usePermission.ts    ← checks current user's permissions
    router.tsx
    main.tsx
  Dockerfile
  vite.config.ts
  package.json
```

## Auth & Security

- Login returns a JWT (HS256, configurable expiry)
- All protected routes require `Authorization: Bearer <token>`
- Application user passwords hashed with bcrypt
- Inventory secrets (passwords, SSH keys) encrypted with Fernet (symmetric) before storage; decrypted only on `/secret` endpoints
- Encryption key set via `APP_SECRET_ENCRYPTION_KEY` env var

## Frontend UI Direction

- Notion-like: clean white/off-white, subtle borders, readable sans-serif (Inter)
- List pages: filterable table with environment badge chips, linked app/team tags
- Detail pages: two-column card layout, related sections (DB users, linked apps/teams) below main fields
- Secret fields: show `••••••••` by default; "Reveal" and "Copy" buttons rendered only if user has `can_view_secrets`
- Sidebar navigation with icons; active route highlighted

## Docker Compose Startup

Backend container entrypoint:
1. Wait for postgres to be ready
2. `alembic upgrade head`
3. `python seed.py` (idempotent — skips if admin already exists)
4. `uvicorn app.main:app --host 0.0.0.0 --port 3000`

## Testing

Pytest tests covering:
- Login works with admin / (password from INITIAL_ADMIN_PASSWORD env var)
- Admin can create a database record
- Admin can create an EC2 record
- Reader cannot call secret endpoints (403)
- User without `can_view_secrets` gets 403 on secret endpoints
- Secret Reader can call secret endpoints (200)

## Known Limitations (Phase 1)

- Secrets stored in PostgreSQL (no external secret manager)
- No SSO / AWS IAM integration
- No audit log
- No multi-tenancy
- No CI/CD pipeline
