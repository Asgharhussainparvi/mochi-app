# 🎬 Mochi Studio

A full-stack text-to-video generation app powered by **[genmo/mochi-1-preview](https://huggingface.co/genmo/mochi-1-preview)**.

```
Frontend (React + Vite)  →  FastAPI Backend  →  Redis Queue  →  GPU Worker (Mochi-1)
                                    ↕
                            PostgreSQL (jobs, users)
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion, Zustand, TanStack Query |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL, Alembic |
| Job Queue | Redis + ARQ |
| ML Worker | genmo/mochi-1-preview via 🤗 Diffusers |
| Auth | OAuth 2.0 — Google & GitHub |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions → Docker Hub → SSH deploy |

---

## Quick Start (Local)

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/mochi-studio.git
cd mochi-studio
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

### 2. Set up OAuth apps

**Google:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:8000/api/auth/google/callback` to redirect URIs
4. Copy Client ID & Secret to `.env`

**GitHub:**
1. Go to https://github.com/settings/developers → New OAuth App
2. Set callback URL: `http://localhost:8000/api/auth/github/callback`
3. Copy Client ID & Secret to `.env`

### 3. Get HuggingFace token

```bash
# Visit https://huggingface.co/settings/tokens
# Add HF_TOKEN=hf_xxx to backend/.env
```

### 4. Run (CPU mode for dev, GPU for real generation)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/health

---

## Project Structure

```
mochi-app/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # auth.py, videos.py, jobs.py
│   │   ├── core/            # config.py, security.py
│   │   ├── db/              # session.py, base.py
│   │   ├── models/          # user.py, video.py
│   │   ├── schemas/         # schemas.py
│   │   ├── services/        # mochi.py, oauth.py
│   │   ├── workers/         # video_worker.py (ARQ)
│   │   └── main.py
│   ├── Dockerfile           # multi-stage: api + worker targets
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/video/ # GenerateForm.tsx, JobCard.tsx
│   │   ├── hooks/           # useJobStream.ts (SSE)
│   │   ├── lib/             # api.ts
│   │   ├── pages/           # LoginPage, DashboardPage, AuthCallbackPage
│   │   ├── store/           # authStore.ts (Zustand)
│   │   └── styles/          # globals.css
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/
│   └── ci-cd.yml            # Test → Build → Push → Deploy
└── docker-compose.yml
```

---

## CI/CD Pipeline

### GitHub Secrets required

| Secret | Description |
|---|---|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username |
| `DOCKER_HUB_TOKEN` | Docker Hub access token |
| `DEPLOY_HOST` | Production server IP/hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment |

### Pipeline stages

```
push to main
    │
    ├─▶ test-backend   (pytest + postgres + redis)
    ├─▶ test-frontend  (tsc + vite build)
    │
    └─▶ build-and-push (if both pass)
            ├─ mochi-api:latest + mochi-api:<sha>
            ├─ mochi-worker:latest + mochi-worker:<sha>
            └─ mochi-frontend:latest + mochi-frontend:<sha>
                    │
                    └─▶ deploy (SSH → docker compose up)
```

### Images built

- `YOUR_USERNAME/mochi-api` — FastAPI server (no ML deps)
- `YOUR_USERNAME/mochi-worker` — ARQ worker with torch + diffusers
- `YOUR_USERNAME/mochi-frontend` — React app served by nginx

---

## GPU Requirements

Mochi-1-preview requires:
- **VRAM:** ~24 GB (A100 / H100 / 4090)
- **RAM:** 32 GB+
- CUDA 11.8+

The worker uses `enable_model_cpu_offload()` + `enable_vae_tiling()` to reduce peak VRAM.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/google/login` | Redirect to Google OAuth |
| GET | `/api/auth/github/login` | Redirect to GitHub OAuth |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/videos/` | Create generation job |
| GET | `/api/videos/` | List my jobs |
| GET | `/api/videos/{id}` | Get job status |
| GET | `/api/videos/{id}/file` | Download video |
| DELETE | `/api/videos/{id}` | Delete job |
| GET | `/api/jobs/{id}/stream` | SSE progress stream |

Full docs at `http://localhost:8000/docs`

---

## Environment Variables

See `backend/.env.example` for all options.

---

## License

MIT
