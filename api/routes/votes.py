"""Votes routes."""

import datetime
from flask import Blueprint, jsonify, request, abort, g
from middleware.auth import login_required
from models.vote import create_vote, delete_vote, get_vote

votes_bp = Blueprint("votes", __name__)


def _serialize_dt(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    return obj


def _serialize_vote(vote: dict) -> dict:
    vote = dict(vote)
    if vote.get("created_at"):
        vote["created_at"] = _serialize_dt(vote["created_at"])
    return vote


@votes_bp.route("/votes", methods=["POST"])
@login_required
def cast_vote():
    """POST /api/forum/votes — vote on a post or reply.

    Body: {"post_id": N} or {"reply_id": N}
    """
    data = request.get_json(silent=True) or {}
    post_id = data.get("post_id")
    reply_id = data.get("reply_id")

    if post_id is None and reply_id is None:
        abort(400, description="Either post_id or reply_id is required")
    if post_id is not None and reply_id is not None:
        abort(400, description="Provide only post_id or reply_id, not both")

    # Convert to int
    try:
        if post_id is not None:
            post_id = int(post_id)
            reply_id = None
        else:
            reply_id = int(reply_id)
            post_id = None
    except (TypeError, ValueError):
        abort(400, description="post_id and reply_id must be integers")

    vote = create_vote(
        mongo_user_id=g.user_id,
        post_id=post_id,
        reply_id=reply_id,
    )

    if vote is None:
        # Already voted — return existing vote
        existing = get_vote(g.user_id, post_id, reply_id)
        if existing:
            return jsonify(_serialize_vote(existing)), 200
        # Shouldn't happen, but handle gracefully
        return jsonify({"message": "already voted"}), 200

    return jsonify(_serialize_vote(vote)), 201


@votes_bp.route("/votes", methods=["DELETE"])
@login_required
def remove_vote():
    """DELETE /api/forum/votes — remove a vote on a post or reply.

    Body: {"post_id": N} or {"reply_id": N}
    """
    data = request.get_json(silent=True) or {}
    post_id = data.get("post_id")
    reply_id = data.get("reply_id")

    if post_id is None and reply_id is None:
        abort(400, description="Either post_id or reply_id is required")
    if post_id is not None and reply_id is not None:
        abort(400, description="Provide only post_id or reply_id, not both")

    try:
        if post_id is not None:
            post_id = int(post_id)
            reply_id = None
        else:
            reply_id = int(reply_id)
            post_id = None
    except (TypeError, ValueError):
        abort(400, description="post_id and reply_id must be integers")

    deleted = delete_vote(
        mongo_user_id=g.user_id,
        post_id=post_id,
        reply_id=reply_id,
    )

    if not deleted:
        abort(404)

    return jsonify({"deleted": True})
