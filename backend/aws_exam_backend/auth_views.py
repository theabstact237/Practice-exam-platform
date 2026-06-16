"""
OAuth helper endpoints for the mobile app.

GitHub's OAuth flow requires exchanging the authorization code with the client
*secret* on the server. For mobile we also mint a Firebase *custom token* so the
app can sign in without relying on GithubAuthProvider credentials (which only
accept tokens from Firebase's own GitHub OAuth app, not the mobile redirect app).
"""
import json
import os
import secrets

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .firebase_admin_client import AccountProviderConflict, create_custom_token_for_github_user

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _exchange_github_code(code: str, redirect_uri):
    client_id = os.getenv("GITHUB_CLIENT_ID", "")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        return {"error": "GitHub OAuth is not configured on the server.", "status": 500}

    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
    }
    if redirect_uri:
        payload["redirect_uri"] = redirect_uri

    try:
        resp = requests.post(
            GITHUB_TOKEN_URL,
            data=payload,
            headers={"Accept": "application/json"},
            timeout=15,
        )
    except requests.RequestException:
        return {"error": "Could not reach GitHub to complete sign-in.", "status": 502}

    data = resp.json() if resp.content else {}
    access_token = data.get("access_token")
    if not access_token:
        return {
            "error": data.get("error_description") or data.get("error") or "Token exchange failed.",
            "status": 400,
        }

    return {"access_token": access_token, "token_type": data.get("token_type", "bearer")}


def _github_profile(access_token: str) -> dict:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    user_resp = requests.get(GITHUB_USER_URL, headers=headers, timeout=15)
    user_resp.raise_for_status()
    user = user_resp.json()

    email = user.get("email")
    if not email:
        emails_resp = requests.get(GITHUB_EMAILS_URL, headers=headers, timeout=15)
        if emails_resp.ok:
            for entry in emails_resp.json():
                if entry.get("primary") and entry.get("verified"):
                    email = entry.get("email")
                    break
            if not email:
                for entry in emails_resp.json():
                    if entry.get("verified"):
                        email = entry.get("email")
                        break

    return {
        "id": user.get("id"),
        "email": email,
        "name": user.get("name") or user.get("login"),
        "avatar_url": user.get("avatar_url"),
    }


@csrf_exempt
@require_http_methods(["POST"])
def github_exchange(request):
    """Exchange a GitHub authorization code for an access token (legacy)."""
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    code = body.get("code")
    if not code:
        return JsonResponse({"error": "Missing authorization code."}, status=400)

    result = _exchange_github_code(code, body.get("redirect_uri"))
    if "error" in result:
        return JsonResponse({"error": result["error"]}, status=result["status"])

    return JsonResponse(
        {"access_token": result["access_token"], "token_type": result["token_type"]}
    )


@csrf_exempt
@require_http_methods(["POST"])
def github_mobile_signin(request):
    """
    Complete mobile GitHub sign-in: code → GitHub profile → Firebase custom token.

    The mobile app calls signInWithCustomToken() with the returned token.
    """
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    code = body.get("code")
    redirect_uri = body.get("redirect_uri")
    if not code:
        return JsonResponse({"error": "Missing authorization code."}, status=400)

    exchange = _exchange_github_code(code, redirect_uri)
    if "error" in exchange:
        return JsonResponse({"error": exchange["error"]}, status=exchange["status"])

    try:
        profile = _github_profile(exchange["access_token"])
    except requests.RequestException:
        return JsonResponse(
            {"error": "Could not load your GitHub profile. Try again."},
            status=502,
        )

    if not profile.get("id"):
        return JsonResponse({"error": "GitHub did not return a user id."}, status=400)

    try:
        custom_token, is_new = create_custom_token_for_github_user(
            github_id=profile["id"],
            email=profile.get("email"),
            display_name=profile.get("name"),
            photo_url=profile.get("avatar_url"),
        )
    except AccountProviderConflict as exc:
        if "google.com" in exc.providers:
            message = (
                "This email is already registered with Google on the web app. "
                "Use Continue with Google instead."
            )
        else:
            message = (
                "This email is already registered with a different sign-in method. "
                "Use the same provider you used on the web app."
            )
        return JsonResponse(
            {"error": message, "code": "account_exists_different_provider"},
            status=409,
        )
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=500)
    except Exception:
        return JsonResponse(
            {"error": "Could not create a Firebase sign-in token."},
            status=500,
        )

    return JsonResponse(
        {
            "custom_token": custom_token,
            "is_new_user": is_new,
            "nonce": secrets.token_hex(8),
        }
    )
