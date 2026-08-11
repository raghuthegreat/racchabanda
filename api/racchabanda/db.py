"""
PostgreSQL connection management.

Uses a per-request connection stored on Flask's g object.
The connection is closed after each request via teardown_appcontext.
"""

import psycopg2
import psycopg2.extras
from urllib.parse import urlparse, unquote
from flask import g, current_app


def get_db():
    """Return a cached psycopg2 connection for the current request."""
    if "db" not in g:
        database_url = current_app.config["DATABASE_URL"]
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        parsed = urlparse(database_url)
        kwargs = {
            "host": parsed.hostname,
            "port": parsed.port or 5432,
            "dbname": parsed.path.lstrip("/") or "postgres",
            "user": unquote(parsed.username) if parsed.username else None,
            "password": unquote(parsed.password) if parsed.password else None,
            "sslmode": "require",
        }
        kwargs = {k: v for k, v in kwargs.items() if v is not None}
        g.db = psycopg2.connect(**kwargs)
    return g.db


def close_db(e=None):
    """Close the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_app(app):
    """Register the teardown function with the Flask app."""
    app.teardown_appcontext(close_db)
