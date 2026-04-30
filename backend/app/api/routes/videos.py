from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.video import VideoJob, JobStatus
from app.schemas.schemas import VideoJobCreate, VideoJobResponse
from app.api.deps import get_current_user
import arq
from app.core.config import settings

router = APIRouter()


async def get_redis_pool():
    return await arq.create_pool(settings.REDIS_URL)


@router.post("/", response_model=VideoJobResponse, status_code=201)
async def create_video_job(
    payload: VideoJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.credits < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    job = VideoJob(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(job)
    current_user.credits -= 1
    await db.commit()
    await db.refresh(job)

    # Enqueue to worker
    try:
        redis = await get_redis_pool()
        await redis.enqueue_job("process_video_job", job.id)
        await redis.close()
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_message = f"Failed to queue job: {e}"
        await db.commit()

    return job


@router.get("/", response_model=List[VideoJobResponse])
async def list_my_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoJob)
        .where(VideoJob.user_id == current_user.id)
        .order_by(VideoJob.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{job_id}", response_model=VideoJobResponse)
async def get_video_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/file")
async def download_video(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job or job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=404, detail="Video not ready")
    if not job.video_path:
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        job.video_path,
        media_type="video/mp4",
        filename=f"mochi_{job_id}.mp4",
    )


@router.delete("/{job_id}", status_code=204)
async def delete_video_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
