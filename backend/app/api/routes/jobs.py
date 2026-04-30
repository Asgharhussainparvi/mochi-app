from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, AsyncSessionLocal
from app.models.video import VideoJob, JobStatus
from app.api.deps import get_current_user
from app.models.user import User
import asyncio
import json

router = APIRouter()


@router.get("/{job_id}/stream")
async def stream_job_progress(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Server-Sent Events stream for job progress."""

    # Verify ownership
    result = await db.execute(
        select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        terminal_states = {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}
        while True:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(VideoJob).where(VideoJob.id == job_id))
                j = res.scalar_one_or_none()
                if j:
                    data = {
                        "status": j.status.value,
                        "progress": j.progress,
                        "video_url": j.video_url,
                        "error": j.error_message,
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    if j.status in terminal_states:
                        break
            await asyncio.sleep(1.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
