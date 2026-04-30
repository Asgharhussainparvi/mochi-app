from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.schemas import TokenResponse, UserResponse
from app.core.security import create_access_token
from app.core.config import settings
from app.services.oauth import exchange_google_code, exchange_github_code
from app.api.deps import get_current_user

router = APIRouter()

GOOGLE_AUTH_URL = (
    "https://accounts.google.com/o/oauth2/v2/auth"
    "?response_type=code"
    "&scope=openid%20email%20profile"
    "&client_id={client_id}"
    "&redirect_uri={redirect_uri}"
)

GITHUB_AUTH_URL = (
    "https://github.com/login/oauth/authorize"
    "?scope=user:email"
    "&client_id={client_id}"
    "&redirect_uri={redirect_uri}"
)


@router.get("/google/login")
async def google_login():
    url = GOOGLE_AUTH_URL.format(
        client_id=settings.GOOGLE_CLIENT_ID,
        redirect_uri=f"{settings.OAUTH_REDIRECT_BASE_URL}/api/auth/google/callback",
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        user_info = await exchange_google_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {e}")
    return await _upsert_user_and_token(db, user_info)


@router.get("/github/login")
async def github_login():
    url = GITHUB_AUTH_URL.format(
        client_id=settings.GITHUB_CLIENT_ID,
        redirect_uri=f"{settings.OAUTH_REDIRECT_BASE_URL}/api/auth/github/callback",
    )
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        user_info = await exchange_github_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {e}")
    return await _upsert_user_and_token(db, user_info)


async def _upsert_user_and_token(db: AsyncSession, user_info: dict) -> dict:
    result = await db.execute(
        select(User).where(User.provider_id == user_info["provider_id"])
    )
    user = result.scalar_one_or_none()

    if user:
        user.name = user_info.get("name") or user.name
        user.avatar_url = user_info.get("avatar_url") or user.avatar_url
    else:
        user = User(**user_info)
        db.add(user)

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    # Redirect to frontend with token
    from fastapi.responses import RedirectResponse
    frontend_url = f"http://localhost:3000/auth/callback?token={token}"
    return RedirectResponse(frontend_url)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
