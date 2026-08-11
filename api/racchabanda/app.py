import os
from flask import Flask
from pymongo import MongoClient
from flask_cors import CORS
from db import init_app as init_db
from config import config


def register_blueprints(app, mongo_db=None):
    from routes.categories import categories_bp
    from routes.posts import posts_bp
    from routes.replies import replies_bp
    from routes.votes import votes_bp
    from routes.definitions import definitions_bp
    from routes.auth import auth_bp
    from routes.upload import upload_bp

    kwargs = {}
    if mongo_db is not None:
        kwargs["mongo_db"] = mongo_db

    for bp in (
        categories_bp,
        posts_bp,
        replies_bp,
        votes_bp,
        definitions_bp,
        auth_bp,
        upload_bp,
    ):
        app.register_blueprint(bp, **kwargs)


def create_forum_app(mongo_db, url_prefix="/api/forum"):
    """
    Create a Flask app (or blueprint attachment point) for the forum.
    Called by the host Yaasalu app which passes its own mongo_db.
    """
    app = Flask(__name__)
    env = os.environ.get("FLASK_ENV", "default")
    app.config.from_object(config[env])

    init_db(app)

    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        vary_header=True,
    )

    register_blueprints(app, mongo_db=mongo_db)

    return app


def create_standalone_app():
    """
    Standalone entry point (used by wsgi.py / gunicorn for local dev or
    running the forum as its own service).
    """

    app = Flask(__name__)
    env = os.environ.get("FLASK_ENV", "default")
    app.config.from_object(config[env])

    init_db(app)

    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        vary_header=True,
    )

    mongo_client = MongoClient(os.environ["MONGO_URI"])
    mongo_db = mongo_client[os.environ.get("MONGO_DB_NAME", "yaasalu")]

    register_blueprints(app, mongo_db=mongo_db)

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_standalone_app()
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
