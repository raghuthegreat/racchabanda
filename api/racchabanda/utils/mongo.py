"""
MongoDB utilities for Racchabanda.

User documents in Yaasalu's MongoDB have the shape:
  { _id: ObjectId, id: str (Google sub), name: str, email: str,
    profile_pic: str, date_joined: str, last_seen: str }

batch_fetch_users always fetches in a single query — never N+1.

The `db` parameter should be Yaasalu's existing PyMongo database object,
passed in via current_app.config["MONGO_DB"] so we reuse the same
MongoClient connection pool rather than opening a second one.
"""

from bson import ObjectId
from flask import current_app


def get_mongo_db():
    """Return the shared MongoDB database handle from app config."""
    return current_app.config["MONGODB"]


def batch_fetch_users(user_ids: list) -> dict:
    """
    Fetch multiple users from MongoDB in a single query.

    Args:
        user_ids: list of MongoDB _id strings

    Returns:
        dict mapping id string -> user dict with keys:
            id, name, avatar_url
    """
    if not user_ids:
        return {}

    unique_ids = list({uid for uid in user_ids if uid})
    if not unique_ids:
        return {}

    object_ids = []
    for uid in unique_ids:
        try:
            object_ids.append(ObjectId(uid))
        except Exception:
            object_ids.append(uid)

    db = get_mongo_db()
    cursor = db.users.find(
        {"_id": {"$in": object_ids}},
        {"_id": 1, "name": 1, "profile_pic": 1},
    )

    result = {}
    for doc in cursor:
        uid_str = str(doc["_id"])
        result[uid_str] = {
            "id": uid_str,
            "name": doc.get("name") or "Anonymous",
            "avatar_url": doc.get("profile_pic", ""),
        }

    for uid in unique_ids:
        if uid not in result:
            result[uid] = {
                "id": uid,
                "name": "Deleted User",
                "avatar_url": "",
            }

    return result
