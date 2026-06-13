from flask import Blueprint, jsonify, abort
from racchabanda.models.category import get_all_categories, get_category_by_slug

categories_bp = Blueprint("categories", __name__)


def _serialize_category(cat: dict) -> dict:
    """Convert datetime objects to ISO strings for JSON serialisation."""
    cat = dict(cat)
    if cat.get("created_at"):
        cat["created_at"] = cat["created_at"].isoformat()
    return cat


@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    """GET /api/forum/categories — list all categories."""
    categories = get_all_categories()
    return jsonify([_serialize_category(c) for c in categories])


@categories_bp.route("/categories/<slug>", methods=["GET"])
def get_category(slug: str):
    """GET /api/forum/categories/<slug> — single category."""
    category = get_category_by_slug(slug)
    if not category:
        abort(404)
    return jsonify(_serialize_category(category))
