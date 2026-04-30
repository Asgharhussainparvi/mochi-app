from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import uuid
import enum


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VideoJob(Base, TimestampMixin):
    __tablename__ = "video_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    num_frames = Column(Integer, default=84)
    fps = Column(Integer, default=24)
    guidance_scale = Column(Float, default=4.5)
    num_inference_steps = Column(Integer, default=64)
    seed = Column(Integer, nullable=True)

    status = Column(SAEnum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True)
    progress = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
    video_path = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    user = relationship("User", back_populates="videos")
