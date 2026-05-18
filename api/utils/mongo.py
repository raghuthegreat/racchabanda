"""
MongoDB utilities for Racchabanda.

User documents in Yaasalu's MongoDB have the shape:
  { _id: ObjectId, username: str, display_name: str, avatar_url: str, ... }

batch_fetch_users always fetches in a single query — never N+1.
"""

from pymongo import MongoClient
from bson import ObjectId
from flask import current_app, g


def get_mongo_db():
    """Return a cached MongoDB database handle stored on Flask's g object."""
    if "mongo_db" not in g:
        client = MongoClient(current_app.config["MONGO_URI"])
        g.mongo_client = client
        g.mongo_db = client[current_app.config["MONGO_DB_NAME"]]
    return g.mongo_db


def batch_fetch_users(user_ids: list[str]) -> dict[str, dict]:
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

    # Deduplicate
    unique_ids = list({uid for uid in user_ids if uid})
    if not unique_ids:
        return {}

    # Convert to ObjectId where possible; keep strings that aren't valid ObjectIds
    object_ids = []
    for uid in unique_ids:
        try:
            object_ids.append(ObjectId(uid))
        except Exception:
            object_ids.append(uid)

    db = get_mongo_db()
    cursor = db.users.find(
        {"_id": {"$in": object_ids}},
        {"_id": 1, "username": 1, "display_name": 1, "avatar_url": 1},
    )

    result = {}
    for doc in cursor:
        uid_str = str(doc["_id"])
        result[uid_str] = {
            "id": uid_str,
            "name": doc.get("display_name") or doc.get("username") or "Anonymous",
            "avatar_url": doc.get("avatar_url", ""),
        }

    # Fill in placeholders for any ids that weren't found
    for uid in unique_ids:
        if uid not in result:
            result[uid] = {
                "id": uid,
                "name": "Deleted User",
                "avatar_url": "",
            }

    return result
