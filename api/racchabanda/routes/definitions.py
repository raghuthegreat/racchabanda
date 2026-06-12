"""Definitions routes."""

import datetime
from flask import Blueprint, jsonify, request, abort, g
from ..middleware.auth import login_required, admin_required, load_user
from ..models.post import get_post_by_id
from ..models.definition import (
    get_definitions_for_post,
    get_definition_by_id,
    create_definition,
    set_top_answer,
)
from ..utils.mongo import batch_fetch_users

definitions_bp = Blueprint("definitions", __name__)


def _serialize_dt(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    return obj


def _serialize_definition(defn: dict, users: dict) -> dict:
    defn = dict(defn)
    if defn.get("created_at"):
        defn["created_at"] = _serialize_dt(defn["created_at"])
    uid = defn.get("mongo_user_id", "")
    defn["author"] = users.get(uid, {"id": uid, "name": "Unknown", "avatar_url": ""})
    return defn


@definitions_bp.route("/posts/<int:post_id>/definitions", methods=["GET"])
def list_definitions(post_id: int):
    """GET /api/forum/posts/<post_id>/definitions — list definitions for a word-request post."""
    load_user()

    post = get_post_by_id(post_id)
    if not post:
        abort(404)

    definitions = get_definitions_for_post(post_id)
    user_ids = [d["mongo_user_id"] for d in definitions]
    users = batch_fetch_users(user_ids)

    return jsonify([_serialize_definition(d, users) for d in definitions])


@definitions_bp.route("/posts/<int:post_id>/definitions", methods=["POST"])
@login_required
def submit_definition(post_id: int):
    """POST /api/forum/posts/<post_id>/definitions — submit a definition."""
    post = get_post_by_id(post_id)
    if not post:
        abort(404)

    data = request.get_json(silent=True) or {}
    definition_text = (data.get("definition") or "").strip()
    if not definition_text:
        abort(400, description="definition is required")

    example = (data.get("example") or "").strip() or None
    region = (data.get("region") or "").strip() or None

    defn = create_definition(
        post_id=post_id,
        mongo_user_id=g.user_id,
        definition=definition_text,
        example=example,
        region=region,
    )

    users = batch_fetch_users([defn["mongo_user_id"]])
    return jsonify(_serialize_definition(defn, users)), 201


@definitions_bp.route("/definitions/<int:definition_id>/top", methods=["PATCH"])
@admin_required
def mark_top_answer(definition_id: int):
    """PATCH /api/forum/definitions/<id>/top — mark definition as top answer (admin only)."""
    defn = get_definition_by_id(definition_id)
    if not defn:
        abort(404)

    updated = set_top_answer(definition_id=definition_id, post_id=defn["post_id"])
    if not updated:
        abort(404)

    users = batch_fetch_users([updated["mongo_user_id"]])
    return jsonify(_serialize_definition(updated, users))
