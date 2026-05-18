"""Replies routes."""

import datetime
from flask import Blueprint, jsonify, request, abort, g
from middleware.auth import login_required, load_user
from models.post import get_post_by_id
from models.reply import create_reply, get_reply_by_id, delete_reply
from utils.mongo import batch_fetch_users

replies_bp = Blueprint("replies", __name__)


def _serialize_dt(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    return obj


def _serialize_reply(reply: dict, users: dict) -> dict:
    reply = dict(reply)
    if reply.get("created_at"):
        reply["created_at"] = _serialize_dt(reply["created_at"])
    uid = reply.get("mongo_user_id", "")
    reply["author"] = users.get(uid, {"id": uid, "name": "Unknown", "avatar_url": ""})
    return reply


@replies_bp.route("/posts/<int:post_id>/replies", methods=["POST"])
@login_required
def add_reply(post_id: int):
    """POST /api/forum/posts/<post_id>/replies — add a reply to a post."""
    post = get_post_by_id(post_id)
    if not post:
        abort(404)

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        abort(400, description="body is required")

    is_admin_reply = bool(g.is_admin)

    reply = create_reply(
        post_id=post_id,
        mongo_user_id=g.user_id,
        body=body,
        is_admin_reply=is_admin_reply,
    )

    users = batch_fetch_users([reply["mongo_user_id"]])
    return jsonify(_serialize_reply(reply, users)), 201


@replies_bp.route("/replies/<int:reply_id>", methods=["DELETE"])
@login_required
def remove_reply(reply_id: int):
    """DELETE /api/forum/replies/<id> — delete own reply or any reply (admin)."""
    reply = get_reply_by_id(reply_id)
    if not reply:
        abort(404)

    if reply["mongo_user_id"] != g.user_id and not g.is_admin:
        abort(403)

    deleted = delete_reply(reply_id)
    if not deleted:
        abort(404)

    return jsonify({"deleted": True, "id": reply_id})
