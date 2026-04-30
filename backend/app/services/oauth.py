import httpx
from app.core.config import settings


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"
GITHUB_EMAIL_URL = "https://api.github.com/user/emails"


async def exchange_google_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE_URL}/api/auth/google/callback",
            "grant_type": "authorization_code",
        })
        token_resp.raise_for_status()
        tokens = token_resp.json()

        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        user_resp.raise_for_status()
        user_info = user_resp.json()

        return {
            "provider": "google",
            "provider_id": str(user_info["id"]),
            "email": user_info["email"],
            "name": user_info.get("name"),
            "avatar_url": user_info.get("picture"),
        }


async def exchange_github_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
            },
            headers={"Accept": "application/json"},
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        user_resp = await client.get(GITHUB_USERINFO_URL, headers=headers)
        user_resp.raise_for_status()
        user_info = user_resp.json()

        # Get primary email
        email = user_info.get("email")
        if not email:
            email_resp = await client.get(GITHUB_EMAIL_URL, headers=headers)
            emails = email_resp.json()
            primary = next((e for e in emails if e["primary"] and e["verified"]), None)
            email = primary["email"] if primary else emails[0]["email"]

        return {
            "provider": "github",
            "provider_id": str(user_info["id"]),
            "email": email,
            "name": user_info.get("name") or user_info.get("login"),
            "avatar_url": user_info.get("avatar_url"),
        }
