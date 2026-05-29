from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.associations import ec2_applications, ec2_teams


class EC2Server(Base):
    __tablename__ = "ec2_servers"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    instance_id = Column(String(200))
    environment = Column(String(50), nullable=False)
    private_ip = Column(String(50))
    hostname = Column(String(255))
    region = Column(String(100))
    account = Column(String(200))
    operating_system = Column(String(200))
    ssh_username = Column(String(200))
    ssh_private_key_encrypted = Column(Text)
    description = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", secondary=ec2_applications, lazy="joined")
    teams = relationship("Team", secondary=ec2_teams, lazy="joined")
