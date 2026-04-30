from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.video import JobStatus


# --- Auth ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    provider: str
    credits: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Video Jobs ---
class VideoJobCreate(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    num_frames: int = 84
    fps: int = 24
    guidance_scale: float = 4.5
    num_inference_steps: int = 64
    seed: Optional[int] = None


class VideoJobResponse(BaseModel):
    id: str
    user_id: str
    prompt: str
    negative_prompt: Optional[str]
    num_frames: int
    fps: int
    guidance_scale: float
    num_inference_steps: int
    seed: Optional[int]
    status: JobStatus
    progress: int
    error_message: Optional[str]
    video_url: Optional[str]
    duration_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()
