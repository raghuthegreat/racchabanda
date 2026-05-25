"""
Racchabanda Forum — Flask blueprints.

Production use (integrated into Yaasalu):
    In Yaasalu's app.py:

        from forum.app import register_blueprints
        register_blueprints(app, mongo_db=db)

    where `db` is Yaasalu's existing PyMongo database object.

Standalone local dev:
    python app.py
    Requires DATABASE_URL, MONGO_URI, MONGO_DB_NAME env vars.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS


def register_blueprints(app, mongo_db):
    """
    Register all forum blueprints onto an existing Flask app.

    Args:
        app:      The host Flask app (Yaasalu's app instance)
        mongo_db: Yaasalu's existing PyMongo database object,
                  e.g. MongoClient(MONGO_URI)["yaasalu"]
    """
    # Inject the shared Mongo db so utils/mongo.py can find it
    app.config["MONGO_DB"] = mongo_db

    # Forum defaults — setdefault won't override anything Yaasalu already sets
    app.config.setdefault("PAGE_SIZE", 20)

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


def create_standalone_app():
    """Standalone app for local development — not used when integrated into Yaasalu."""
    from pymongo import MongoClient
    from config import config
    from db import init_app as init_db

    app = Flask(__name__)
    env = os.environ.get("FLASK_ENV", "default")
    app.config.from_object(config[env])

    init_db(app)

    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    mongo_client = MongoClient(os.environ["MONGO_URI"])
    mongo_db = mongo_client[os.environ.get("MONGO_DB_NAME", "yaasalu")]

    register_blueprints(app, mongo_db=mongo_db)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "app": "racchabanda"})

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


app = create_standalone_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
