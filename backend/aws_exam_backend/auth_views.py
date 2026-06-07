"""
OAuth helper endpoints for the mobile app.

GitHub's OAuth "web application" flow requires exchanging the authorization
code for an access token using the client *secret*. That secret must never be
shipped in the mobile bundle, so the exchange happens here. The mobile app
sends the `code` it received from GitHub, we swap it for an access token, and
return that token. The app then builds a Firebase GithubAuthProvider credential
from it and calls signInWithCredential() against the same Firebase project the
web app uses.
"""
import json
import os

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"


@csrf_exempt
@require_http_methods(["POST"])
def github_exchange(request):
    """Exchange a GitHub authorization code for an access token."""
    client_id = os.getenv("GITHUB_CLIENT_ID", "")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        return JsonResponse(
            {"error": "GitHub OAuth is not configured on the server."},
            status=500,
        )

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    code = body.get("code")
    redirect_uri = body.get("redirect_uri")
    if not code:
        return JsonResponse({"error": "Missing authorization code."}, status=400)

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
        return JsonResponse(
            {"error": "Could not reach GitHub to complete sign-in."},
            status=502,
        )

    data = resp.json() if resp.content else {}
    access_token = data.get("access_token")

    if not access_token:
        # GitHub returns 200 with an `error` field on failure.
        return JsonResponse(
            {"error": data.get("error_description") or data.get("error") or "Token exchange failed."},
            status=400,
        )

    return JsonResponse(
        {"access_token": access_token, "token_type": data.get("token_type", "bearer")}
    )
