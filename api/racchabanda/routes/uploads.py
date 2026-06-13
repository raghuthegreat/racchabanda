"""Uploads route — image upload to Cloudinary."""

from flask import Blueprint, jsonify, request, abort, current_app
from racchabanda.middleware.auth import login_required
import cloudinary
import cloudinary.uploader

uploads_bp = Blueprint("uploads", __name__)


def _configure_cloudinary():
    """Configure Cloudinary from app config."""
    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )


@uploads_bp.route("/uploads/image", methods=["POST"])
@login_required
def upload_image():
    """POST /api/forum/uploads/image — upload an image to Cloudinary.

    Accepts multipart/form-data with a file field named 'image'.
    Returns: {"url": "https://res.cloudinary.com/..."}
    """
    _configure_cloudinary()

    if "image" not in request.files:
        abort(400, description="No image file provided — use field name 'image'")

    file = request.files["image"]
    if not file or not file.filename:
        abort(400, description="Empty file")

    # Validate MIME type
    allowed_mimetypes = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.mimetype not in allowed_mimetypes:
        abort(400, description=f"Unsupported image type: {file.mimetype}")

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="racchabanda",
            resource_type="image",
            # Limit to 5 MB
            max_bytes=5 * 1024 * 1024,
        )
    except cloudinary.exceptions.Error as exc:
        current_app.logger.error("Cloudinary upload failed: %s", exc)
        abort(500)

    url = result.get("secure_url") or result.get("url")
    if not url:
        current_app.logger.error("Cloudinary returned no URL: %s", result)
        abort(500)

    return jsonify({"url": url}), 201
