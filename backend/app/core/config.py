from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@postgres:5432/dba_nexus"
    jwt_secret: str = "dev-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    app_secret_encryption_key: str = ""
    initial_admin_username: str = "admin"
    initial_admin_password: str

    model_config = {"env_file": ".env"}


settings = Settings()
