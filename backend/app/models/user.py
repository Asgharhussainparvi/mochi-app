from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    provider = Column(String, nullable=False)  # "google" or "github"
    provider_id = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    credits = Column(Integer, default=10)  # free credits

    videos = relationship("VideoJob", back_populates="user", cascade="all, delete-orphan")
