from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class DatabaseUser(Base):
    __tablename__ = "database_users"

    id = Column(Integer, primary_key=True)
    database_id = Column(Integer, ForeignKey("databases.id", ondelete="CASCADE"), nullable=False)
    username = Column(String(200), nullable=False)
    password_encrypted = Column(Text)
    role_purpose = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    database = relationship("Database", back_populates="db_users")
