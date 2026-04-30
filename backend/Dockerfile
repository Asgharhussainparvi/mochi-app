# ---- Base ----
FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# ---- API (no heavy ML) ----
FROM base AS api
COPY requirements.txt .
# Install everything except torch/diffusers for the API image
RUN pip install --no-deps $(grep -v "^torch\|^diffusers\|^transformers\|^accelerate\|^imageio" requirements.txt | grep -v "^#" | tr '\n' ' ')
COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---- Worker (with GPU/ML deps) ----
FROM base AS worker
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app/ ./app/
CMD ["python", "-m", "arq", "app.workers.video_worker.WorkerSettings"]
