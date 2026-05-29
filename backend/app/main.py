from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, roles, applications, teams, databases, database_users, ec2

app = FastAPI(title="DBA-Nexus", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(databases.router, prefix="/api")
app.include_router(database_users.router, prefix="/api")
app.include_router(ec2.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
