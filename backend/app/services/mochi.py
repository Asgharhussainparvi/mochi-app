"""
Mochi-1 video generation service.
Runs genmo/mochi-1-preview to generate videos from text prompts.
Requires a GPU with ~24GB VRAM (A100/H100 recommended).
"""
import os
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Callable, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class MochiService:
    _instance = None
    _pipeline = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_pipeline(self):
        """Lazily load the Mochi pipeline on first use."""
        if self._pipeline is not None:
            return self._pipeline

        try:
            import torch
            from diffusers import MochiPipeline
            from diffusers.utils import export_to_video

            logger.info(f"Loading {settings.HF_MODEL_ID} ...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if device == "cuda" else torch.float32

            pipe = MochiPipeline.from_pretrained(
                settings.HF_MODEL_ID,
                torch_dtype=dtype,
                token=settings.HF_TOKEN or None,
            )
            pipe.enable_model_cpu_offload()
            pipe.enable_vae_tiling()
            self._pipeline = pipe
            self._export_to_video = export_to_video
            logger.info("Mochi pipeline loaded.")
        except Exception as e:
            logger.error(f"Failed to load Mochi pipeline: {e}")
            raise

        return self._pipeline

    async def generate(
        self,
        job_id: str,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_frames: int = 84,
        fps: int = 24,
        guidance_scale: float = 4.5,
        num_inference_steps: int = 64,
        seed: Optional[int] = None,
        progress_callback: Optional[Callable[[int], None]] = None,
    ) -> str:
        """
        Generate a video and return the saved file path.
        Runs in a thread to avoid blocking the event loop.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self._run_generation(
                job_id, prompt, negative_prompt,
                num_frames, fps, guidance_scale,
                num_inference_steps, seed, progress_callback,
            )
        )

    def _run_generation(
        self, job_id, prompt, negative_prompt,
        num_frames, fps, guidance_scale,
        num_inference_steps, seed, progress_callback,
    ) -> str:
        import torch

        pipe = self._load_pipeline()

        generator = torch.Generator().manual_seed(seed) if seed is not None else None

        def step_callback(step, timestep, latents):
            if progress_callback:
                pct = int((step / num_inference_steps) * 90)
                try:
                    asyncio.get_event_loop().call_soon_threadsafe(
                        lambda: progress_callback(pct)
                    )
                except Exception:
                    pass

        frames = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator,
            callback_on_step_end=step_callback,
        ).frames[0]

        output_dir = Path(settings.LOCAL_STORAGE_PATH) / "videos"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / f"{job_id}.mp4")

        self._export_to_video(frames, output_path, fps=fps)
        logger.info(f"Video saved: {output_path}")
        return output_path


mochi_service = MochiService.get_instance()
