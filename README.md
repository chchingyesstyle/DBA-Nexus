# DBA-Nexus

Internal DBA team inventory management system for tracking databases, EC2 servers, applications, and teams — with controlled access to stored secrets.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Default Login](#default-login)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Managing the App (docker.sh)](#managing-the-app)
- [When to Rebuild](#when-to-rebuild)
- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Secret Handling](#secret-handling)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Known Limitations](#known-limitations)

---

## Quick Start

```bash
git clone https://github.com/chchingyesstyle/DBA-Nexus
cd DBA-Nexus

./docker.sh start
```

Open **http://localhost:8080** in your browser.

> First run takes a few minutes to pull base images and install dependencies.

---

## Default Login

| Username | Password |
|----------|----------|
| `admin`  | _(value of `INITIAL_ADMIN_PASSWORD` in your `.env`)_ |

The default admin user is seeded automatically on first startup. Change the password via the **Admin → Users** page after logging in.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Browser :8080                       │
│              React + Vite + Tailwind                  │
│         (TanStack Query · React Router v6)            │
└───────────────────┬──────────────────────────────────┘
                    │  /api/*  (proxied by Vite)
                    ▼
┌──────────────────────────────────────────────────────┐
│                  Backend :3000                        │
│            Python FastAPI + SQLAlchemy 2              │
│          JWT auth · Fernet secret encryption          │
│          Alembic migrations · bcrypt passwords        │
└───────────────────┬──────────────────────────────────┘
                    │  SQLAlchemy / psycopg2
                    ▼
┌──────────────────────────────────────────────────────┐
│               PostgreSQL 16 :5432                     │
│           Named volume: postgres_data                 │
└──────────────────────────────────────────────────────┘
```

| Service    | Port | Description                                      |
|------------|------|--------------------------------------------------|
| `frontend` | 8080 | React SPA (Vite dev server with HMR)            |
| `backend`  | 3000 | FastAPI REST API                                 |
| `postgres` | 5432 | PostgreSQL database (data persisted in volume)   |

On every startup the backend automatically:
1. Runs `alembic upgrade head` (applies any pending migrations)
2. Seeds default roles, permissions, and the admin user (idempotent — safe to re-run)
3. Starts the uvicorn server

---

## Project Structure

```
DBA-Nexus/
│
├── docker-compose.yml          # Service definitions
├── docker.sh                   # Management script (start/stop/rebuild/logs)
├── .env.example                # Environment variable template
│
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh           # migrate → seed → serve
│   ├── requirements.txt
│   ├── seed.py                 # Idempotent seed for roles + admin user
│   ├── alembic/                # Database migrations
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── main.py             # FastAPI app + router registration
│   │   ├── api/                # Route handlers
│   │   │   ├── auth.py         # POST /api/auth/login, GET /api/auth/me
│   │   │   ├── users.py        # User CRUD (Super Admin only)
│   │   │   ├── roles.py        # Role + permission CRUD
│   │   │   ├── databases.py    # Database inventory CRUD + secret endpoint
│   │   │   ├── database_users.py
│   │   │   ├── ec2.py          # EC2 inventory CRUD + secret endpoint
│   │   │   ├── applications.py
│   │   │   └── teams.py
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── core/
│   │   │   ├── config.py       # Settings from environment variables
│   │   │   ├── security.py     # JWT, bcrypt, Fernet encryption
│   │   │   └── deps.py         # FastAPI dependency injection (auth, permissions)
│   │   └── db/
│   │       ├── base.py         # SQLAlchemy DeclarativeBase
│   │       └── session.py      # DB session + get_db dependency
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_permissions.py
│       ├── test_databases.py
│       └── test_ec2.py
│
└── frontend/
    ├── Dockerfile
    ├── vite.config.ts          # Proxies /api → http://backend:3000
    ├── tailwind.config.js
    ├── src/
    │   ├── main.tsx
    │   ├── router.tsx          # All page routes
    │   ├── types.ts            # Shared TypeScript types
    │   ├── api/                # Axios API client + per-resource modules
    │   ├── hooks/              # useAuth, usePermission
    │   ├── components/         # Shared UI: Layout, Sidebar, SecretField, etc.
    │   └── pages/
    │       ├── Login.tsx
    │       ├── Dashboard.tsx
    │       ├── DatabaseList.tsx / DatabaseDetail.tsx
    │       ├── EC2List.tsx / EC2Detail.tsx
    │       ├── Applications.tsx
    │       ├── Teams.tsx
    │       └── admin/
    │           ├── Users.tsx
    │           └── Roles.tsx
    └── docs/
        └── superpowers/specs/  # Design documents
```

---

## Managing the App

All operations go through `docker.sh`:

```bash
./docker.sh start      # Start all services in the background
./docker.sh stop       # Stop and remove all containers
./docker.sh restart    # Restart all containers (no image rebuild)
./docker.sh rebuild    # Rebuild images and restart (see below)
./docker.sh status     # Show container status and health
./docker.sh logs       # Tail logs from all services
./docker.sh logs backend    # Tail logs from backend only
./docker.sh logs frontend   # Tail logs from frontend only
./docker.sh logs postgres   # Tail logs from postgres only
```

---

## When to Rebuild

The frontend mounts `frontend/src/` as a live volume, so **changes to any `src/` file are picked up instantly via Vite hot-module reload** — no action needed.

For everything else, run `./docker.sh rebuild`:

| Changed file | Action needed |
|---|---|
| `frontend/src/**` | Nothing — Vite HMR auto-reloads |
| `backend/app/**` (Python files) | `./docker.sh rebuild` |
| `backend/requirements.txt` | `./docker.sh rebuild` |
| `backend/seed.py` | `./docker.sh rebuild` |
| `backend/alembic/**` | `./docker.sh rebuild` |
| `frontend/package.json` | `./docker.sh rebuild` |
| `frontend/vite.config.ts` | `./docker.sh rebuild` |
| `frontend/Dockerfile` | `./docker.sh rebuild` |
| `backend/Dockerfile` | `./docker.sh rebuild` |
| `docker-compose.yml` | `./docker.sh rebuild` |

> **Why?** Backend Python code is copied into the Docker image at build time. Changing `.py` files locally has no effect on the running container until the image is rebuilt.

---

## Features

### Inventory

| Resource | Fields |
|---|---|
| **Database / RDS** | Name, engine, environment, hostname, port, region, account, RDS instance ID, admin credentials, description, notes, linked applications & teams, per-database users |
| **EC2 Server** | Name, instance ID, environment, private IP, hostname, region, account, OS, SSH credentials, description, notes, linked applications & teams |
| **Application** | Name, description, owner team, notes |
| **Team** | Name, description, contact, notes |

All list pages support **search**, **filter by environment**, **filter by application**, and **filter by team**.

### Environments

Available environment options: `production`, `staging`, `uat`, `development`, `test`

### Secrets

Database admin passwords, database user passwords, and EC2 SSH private keys are **encrypted at rest** (Fernet/AES-128) and **never returned in list or detail API responses**. They are only accessible via dedicated `/secret` endpoints which require the `can_view_secrets` permission.

In the UI, secret fields display `••••••••` by default. The **Reveal** and **Copy** buttons are only rendered for users who have `can_view_secrets`.

---

## Roles & Permissions

Permissions are named capabilities assigned to roles. Roles can be fully customised via **Admin → Roles**.

### Built-in Permissions

| Permission | What it grants |
|---|---|
| `can_read_inventory` | View all inventory lists and detail pages |
| `can_write_inventory` | Create, update, and delete inventory records |
| `can_view_secrets` | Reveal and copy passwords and SSH private keys |
| `can_manage_users` | Create, update, delete users and manage roles |

### Default Roles

| Role | Read | Write | View Secrets | Manage Users |
|---|:---:|:---:|:---:|:---:|
| **Super Admin** | ✓ | ✓ | ✓ | ✓ |
| **Writer** | ✓ | ✓ | | |
| **Reader** | ✓ | | | |
| **Secret Reader** | ✓ | | ✓ | |

---

## Secret Handling

Secrets are encrypted using [Fernet](https://cryptography.io/en/latest/fernet/) (symmetric AES-128-CBC + HMAC) before being stored in PostgreSQL.

**Set a production encryption key:**

```bash
# Generate a key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Add it to your .env
APP_SECRET_ENCRYPTION_KEY=your-generated-key-here
```

> **Important:** If `APP_SECRET_ENCRYPTION_KEY` is not set, a temporary key is generated each time the backend starts. This means encrypted secrets become unreadable after a restart. Always set this variable in production.

---

## Environment Variables

Copy `.env.example` to `.env` and customise as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `dba_nexus` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `APP_SECRET_ENCRYPTION_KEY` | _(auto-generated)_ | Fernet key for encrypting secrets — **set this in production** |
| `JWT_SECRET` | `dev-jwt-secret-...` | JWT signing secret — **change in production** |
| `INITIAL_ADMIN_USERNAME` | `admin` | Username for the seeded admin account |
| `INITIAL_ADMIN_PASSWORD` | _(required)_ | Password for the seeded admin account — no default, must be set |

---

## Running Tests

Tests require a PostgreSQL instance. The easiest way is to use the running postgres container:

```bash
# 1. Create the test database (one time only)
./docker.sh start
docker compose exec postgres psql -U postgres -c "CREATE DATABASE dba_nexus_test;"

# 2. Run the test suite
docker compose run --rm backend pytest tests/ -v
```

Test coverage:
- Login works with `admin` / (password from `INITIAL_ADMIN_PASSWORD`)
- Admin can create database and EC2 records
- Reader cannot reveal passwords or SSH keys (403)
- User without `can_view_secrets` cannot call secret endpoints (403)
- Secret Reader can call secret endpoints (200)
- Secrets are never present in list API responses

---

## Known Limitations (Phase 1)

- Secrets stored in PostgreSQL — no external secret manager (AWS Secrets Manager, Vault, etc.)
- No SSO or AWS IAM integration
- No audit log
- No multi-tenancy
- Frontend runs Vite dev server — not a production-optimised build
- No CI/CD pipeline
