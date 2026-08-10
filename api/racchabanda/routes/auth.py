"""Auth routes — expose the shared Yaasalu session to the forum frontend."""

from flask import Blueprint, jsonify, g, session

from racchabanda.middleware.auth import load_user
from racchabanda.utils.mongo import batch_fetch_users

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/me", methods=["GET"])
def me():
    """GET /api/forum/auth/me — current user, or {"user": null} if logged out."""
    load_user()
    if not g.is_logged_in:
        return jsonify({"user": None})

    users = batch_fetch_users([g.user_id])
    return jsonify({"user": users.get(g.user_id)})


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """POST /api/forum/auth/logout — clear the shared session cookie."""
    session.clear()
    return "", 204
