from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.associations import database_applications, database_teams


class Database(Base):
    __tablename__ = "databases"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    engine = Column(String(100), nullable=False)
    environment = Column(String(50), nullable=False)
    hostname = Column(String(255))
    port = Column(Integer)
    region = Column(String(100))
    account = Column(String(200))
    rds_instance_id = Column(String(200))
    admin_username = Column(String(200))
    admin_password_encrypted = Column(Text)
    description = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    db_users = relationship("DatabaseUser", back_populates="database", cascade="all, delete-orphan")
    applications = relationship("Application", secondary=database_applications, lazy="joined")
    teams = relationship("Team", secondary=database_teams, lazy="joined")
