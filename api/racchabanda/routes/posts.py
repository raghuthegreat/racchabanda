"""Posts routes."""

from flask import Blueprint, jsonify, request, abort, g
from racchabanda.middleware.auth import login_required, load_user, admin_required
from racchabanda.models.post import get_posts, get_post_by_id, create_post, update_post
from racchabanda.models.reply import get_replies_for_post
from racchabanda.models.definition import get_definitions_for_post
from racchabanda.utils.mongo import batch_fetch_users
from flask import current_app
import datetime

posts_bp = Blueprint("posts", __name__)


def _serialize_dt(obj):
    """Convert datetime to ISO string if needed."""
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    return obj


def _serialize_post(post: dict, users: dict, current_user_id: str = None) -> dict:
    post = dict(post)
    for field in ("created_at", "updated_at"):
        if post.get(field):
            post[field] = _serialize_dt(post[field])
    uid = post.get("mongo_user_id", "")
    post["author"] = users.get(uid, {"id": uid, "name": "Unknown", "avatar_url": ""})
    return post


def _serialize_reply(reply: dict, users: dict) -> dict:
    reply = dict(reply)
    if reply.get("created_at"):
        reply["created_at"] = _serialize_dt(reply["created_at"])
    uid = reply.get("mongo_user_id", "")
    reply["author"] = users.get(uid, {"id": uid, "name": "Unknown", "avatar_url": ""})
    return reply


def _serialize_definition(defn: dict, users: dict) -> dict:
    defn = dict(defn)
    if defn.get("created_at"):
        defn["created_at"] = _serialize_dt(defn["created_at"])
    uid = defn.get("mongo_user_id", "")
    defn["author"] = users.get(uid, {"id": uid, "name": "Unknown", "avatar_url": ""})
    return defn


@posts_bp.route("/posts", methods=["GET"])
def list_posts():
    """GET /api/forum/posts — list posts with optional filters and pagination."""
    load_user()

    category_id = request.args.get("category_id", type=int)
    region = request.args.get("region")
    post_type = request.args.get("post_type")
    status = request.args.get("status")
    page = request.args.get("page", 1, type=int)
    if page < 1:
        page = 1

    posts, total = get_posts(
        category_id=category_id,
        region=region,
        post_type=post_type,
        status=status,
        page=page,
    )

    user_ids = [p["mongo_user_id"] for p in posts]
    users = batch_fetch_users(user_ids)

    page_size = current_app.config["PAGE_SIZE"]
    import math
    pages = math.ceil(total / page_size) if total else 1

    serialized = [_serialize_post(p, users) for p in posts]

    return jsonify({
        "items": serialized,
        "total": total,
        "page": page,
        "pages": pages,
    })


@posts_bp.route("/posts", methods=["POST"])
@login_required
def create_post_route():
    """POST /api/forum/posts — create a new post."""
    data = request.get_json(silent=True) or {}

    category_id = data.get("category_id")
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip() or None
    image_url = (data.get("image_url") or "").strip() or None
    post_type = (data.get("post_type") or "").strip()
    region = (data.get("region") or "").strip() or None
    word = (data.get("word") or "").strip() or None
    word_telugu = (data.get("word_telugu") or "").strip() or None

    if not category_id:
        abort(400, description="category_id is required")
    if not title:
        abort(400, description="title is required")
    if not post_type:
        abort(400, description="post_type is required")

    post = create_post(
        category_id=category_id,
        mongo_user_id=g.user_id,
        title=title,
        body=body,
        image_url=image_url,
        post_type=post_type,
        region=region,
        word=word,
        word_telugu=word_telugu,
    )

    users = batch_fetch_users([post["mongo_user_id"]])
    return jsonify(_serialize_post(post, users)), 201


@posts_bp.route("/posts/<int:post_id>", methods=["GET"])
def get_post(post_id: int):
    """GET /api/forum/posts/<id> — post detail with replies and definitions."""
    load_user()

    post = get_post_by_id(post_id)
    if not post:
        abort(404)

    replies = get_replies_for_post(post_id)
    definitions = get_definitions_for_post(post_id)

    # Batch fetch all user IDs in one query
    user_ids = (
        [post["mongo_user_id"]]
        + [r["mongo_user_id"] for r in replies]
        + [d["mongo_user_id"] for d in definitions]
    )
    users = batch_fetch_users(user_ids)

    serialized_post = _serialize_post(post, users)
    serialized_post["replies"] = [_serialize_reply(r, users) for r in replies]
    serialized_post["definitions"] = [_serialize_definition(d, users) for d in definitions]

    return jsonify(serialized_post)


@posts_bp.route("/posts/<int:post_id>", methods=["PATCH"])
def patch_post(post_id: int):
    """PATCH /api/forum/posts/<id> — update post (admin fields: status, yaasalu_word_url, is_pinned)."""
    load_user()
    if not g.is_logged_in:
        abort(401)

    post = get_post_by_id(post_id)
    if not post:
        abort(404)

    # Only admin can update admin-only fields; owners can update title/body/image_url
    data = request.get_json(silent=True) or {}

    admin_fields = {"status", "yaasalu_word_url", "is_pinned"}
    owner_fields = {"title", "body", "image_url"}

    allowed_fields = set()
    if g.is_admin:
        allowed_fields = admin_fields | owner_fields
    elif post["mongo_user_id"] == g.user_id:
        allowed_fields = owner_fields
    else:
        abort(403)

    fields = {k: v for k, v in data.items() if k in allowed_fields}

    updated = update_post(post_id, fields)
    if not updated:
        abort(404)

    replies = get_replies_for_post(post_id)
    definitions = get_definitions_for_post(post_id)
    user_ids = (
        [updated["mongo_user_id"]]
        + [r["mongo_user_id"] for r in replies]
        + [d["mongo_user_id"] for d in definitions]
    )
    users = batch_fetch_users(user_ids)

    serialized = _serialize_post(updated, users)
    serialized["replies"] = [_serialize_reply(r, users) for r in replies]
    serialized["definitions"] = [_serialize_definition(d, users) for d in definitions]

    return jsonify(serialized)
