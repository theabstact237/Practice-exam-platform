"""
Lazy Firebase Admin SDK initialization for server-side auth (mobile GitHub sign-in).

Requires a service account JSON from Firebase Console → Project settings →
Service accounts → Generate new private key.

Set either:
  FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
  FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
"""
import json
import os
from typing import Optional

import firebase_admin
from firebase_admin import auth, credentials

_app = None


def _init_app():
    global _app
    if _app is not None:
        return _app

    json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()

    if json_str:
        cred = credentials.Certificate(json.loads(json_str))
    elif path and os.path.isfile(path):
        cred = credentials.Certificate(path)
    else:
        raise RuntimeError(
            "Firebase service account is not configured. "
            "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."
        )

    _app = firebase_admin.initialize_app(cred)
    return _app


def create_custom_token_for_github_user(
    github_id: int,
    email: Optional[str],
    display_name: Optional[str],
    photo_url: Optional[str],
) -> tuple:
    """
    Resolve the shared Firebase user for a GitHub identity and mint a custom token.

    Returns (custom_token, is_new_user).
    Raises AccountProviderConflict if the email belongs to a non-GitHub account.
    """
    _init_app()
    github_uid = str(github_id)
    is_new = False

    try:
        user = auth.get_user_by_provider_uid("github.com", github_uid)
        token = auth.create_custom_token(user.uid)
        return token.decode("utf-8"), is_new
    except auth.UserNotFoundError:
        pass

    if email:
        try:
            existing = auth.get_user_by_email(email)
            providers = [p.provider_id for p in existing.provider_data]
            if "github.com" not in providers:
                raise AccountProviderConflict(providers)
            token = auth.create_custom_token(existing.uid)
            return token.decode("utf-8"), is_new
        except auth.UserNotFoundError:
            pass

    create_kwargs: dict = {}
    if email:
        create_kwargs["email"] = email
        create_kwargs["email_verified"] = True
    if display_name:
        create_kwargs["display_name"] = display_name
    if photo_url:
        create_kwargs["photo_url"] = photo_url

    user = auth.create_user(**create_kwargs)
    is_new = True

    auth.update_user(
        user.uid,
        provider_to_link=auth.ProviderUserInfo(
            provider_id="github.com",
            uid=github_uid,
            display_name=display_name or None,
            photo_url=photo_url or None,
            email=email or None,
        ),
    )

    token = auth.create_custom_token(user.uid)
    return token.decode("utf-8"), is_new


class AccountProviderConflict(Exception):
    def __init__(self, providers: list[str]):
        self.providers = providers
        super().__init__(f"Account exists with providers: {providers}")
