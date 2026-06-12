"""
Auth middleware for Racchabanda.

Both Yaasalu and Racchabanda share the same Flask SECRET_KEY and
SESSION_COOKIE_DOMAIN (.yaasalu.com), so Flask's signed session cookie
is readable in both apps without any extra token exchange.

The session stores `user_id` (a MongoDB _id string) and optionally
`is_admin` (bool).
"""

from functools import wraps
from flask import session, g, abort


def load_user():
    """
    Populate g.user_id and g.is_logged_in from the shared session cookie.
    Call this before_request or inline.
    """
    user_id = session.get("user_id")
    g.user_id = user_id
    g.is_logged_in = bool(user_id)
    g.is_admin = bool(session.get("is_admin", False))


def login_required(f):
    """Decorator: 401 if the user is not authenticated."""

    @wraps(f)
    def decorated(*args, **kwargs):
        load_user()
        if not g.is_logged_in:
            abort(401)
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator: 403 if the user is not an admin."""

    @wraps(f)
    def decorated(*args, **kwargs):
        load_user()
        if not g.is_logged_in:
            abort(401)
        if not g.is_admin:
            abort(403)
        return f(*args, **kwargs)

    return decorated
