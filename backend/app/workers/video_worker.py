"""
Background worker that processes video generation jobs from a Redis queue.
Uses ARQ (Async Redis Queue) for job management.
"""
import logging
from app.db.session import AsyncSessionLocal
from app.models.video import VideoJob, JobStatus
from app.services.mochi import mochi_service
from app.core.config import settings
from sqlalchemy import select

logger = logging.getLogger(__name__)


async def process_video_job(ctx, job_id: str):
    """ARQ task: generate a video for the given job_id."""
    async with AsyncSessionLocal() as db:
        # Fetch job
        result = await db.execute(select(VideoJob).where(VideoJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            logger.error(f"Job {job_id} not found")
            return

        # Mark as processing
        job.status = JobStatus.PROCESSING
        job.progress = 0
        await db.commit()

        async def update_progress(pct: int):
            async with AsyncSessionLocal() as inner_db:
                res = await inner_db.execute(select(VideoJob).where(VideoJob.id == job_id))
                j = res.scalar_one_or_none()
                if j:
                    j.progress = pct
                    await inner_db.commit()

        try:
            video_path = await mochi_service.generate(
                job_id=job_id,
                prompt=job.prompt,
                negative_prompt=job.negative_prompt,
                num_frames=job.num_frames,
                fps=job.fps,
                guidance_scale=job.guidance_scale,
                num_inference_steps=job.num_inference_steps,
                seed=job.seed,
                progress_callback=update_progress,
            )

            # Update job with result
            result2 = await db.execute(select(VideoJob).where(VideoJob.id == job_id))
            job = result2.scalar_one_or_none()
            if job:
                job.status = JobStatus.COMPLETED
                job.progress = 100
                job.video_path = video_path
                job.video_url = f"/api/videos/{job_id}/file"
                await db.commit()
                logger.info(f"Job {job_id} completed")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            result3 = await db.execute(select(VideoJob).where(VideoJob.id == job_id))
            job = result3.scalar_one_or_none()
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                await db.commit()


class WorkerSettings:
    """ARQ worker settings."""
    functions = [process_video_job]
    redis_settings = settings.REDIS_URL
    max_jobs = settings.MAX_CONCURRENT_JOBS
    job_timeout = settings.VIDEO_GENERATION_TIMEOUT
