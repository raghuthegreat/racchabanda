"""Standalone entrypoint for local dev / Heroku.

Requires DATABASE_URL, MONGO_URI, MONGO_DB_NAME env vars.
"""

import os
from racchabanda.app import create_standalone_app

app = create_standalone_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
