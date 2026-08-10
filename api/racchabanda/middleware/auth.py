"""
Auth middleware for Racchabanda.

Yaasalu and Racchabanda share the same Flask SECRET_KEY, so the signed
session cookie set by Yaasalu's Google login (backend/app.py) is readable
here too. Yaasalu logs users in via flask_login.login_user(), which stores
the identifier under session["_user_id"] (flask_login's own key) — not
session["user_id"]. That value is the user's Google `sub`, i.e. the "id"
field on the yaasa `users` collection, NOT that collection's Mongo `_id`.
Racchabanda's posts/replies/definitions store `mongo_user_id` as the
document's actual Mongo `_id` string, so we look the user doc up by its
Google-sub "id" field and use its `_id` as g.user_id.
"""

from functools import wraps
from flask import session, g, abort, current_app


def load_user():
    """
    Populate g.user_id, g.is_logged_in and g.is_admin from the session
    cookie Yaasalu's login flow set. Call this before_request or inline.
    """
    g.user_id = None
    g.is_logged_in = False
    g.is_admin = False

    google_sub = session.get("_user_id")
    if not google_sub:
        return

    user_doc = current_app.config["MONGODB"].users.find_one({"id": google_sub})
    if not user_doc:
        return

    g.user_id = str(user_doc["_id"])
    g.is_logged_in = True
    g.is_admin = bool(user_doc.get("is_admin", False))


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
