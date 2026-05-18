import os
from flask import Flask, jsonify
from flask_cors import CORS

from config import config
from db import init_app as init_db


def create_app(env=None):
    app = Flask(__name__)

    env = env or os.environ.get("FLASK_ENV", "default")
    app.config.from_object(config[env])

    # Database teardown
    init_db(app)

    # CORS — allow credentials so the shared session cookie is sent
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
    )

    # Register blueprints
    from routes.categories import categories_bp
    from routes.posts import posts_bp
    from routes.replies import replies_bp
    from routes.votes import votes_bp
    from routes.definitions import definitions_bp
    from routes.uploads import uploads_bp

    app.register_blueprint(categories_bp, url_prefix="/api/forum")
    app.register_blueprint(posts_bp, url_prefix="/api/forum")
    app.register_blueprint(replies_bp, url_prefix="/api/forum")
    app.register_blueprint(votes_bp, url_prefix="/api/forum")
    app.register_blueprint(definitions_bp, url_prefix="/api/forum")
    app.register_blueprint(uploads_bp, url_prefix="/api/forum")

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "app": "racchabanda"})

    # Generic error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": str(e.description)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorised — please log in"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
