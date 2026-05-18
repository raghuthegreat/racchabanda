"""Vote model — plain psycopg2 queries."""

import psycopg2.extras
import psycopg2
from db import get_db


def get_vote(mongo_user_id: str, post_id: int | None, reply_id: int | None) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if post_id is not None:
            cur.execute(
                "SELECT * FROM votes WHERE mongo_user_id = %s AND post_id = %s",
                (mongo_user_id, post_id),
            )
        else:
            cur.execute(
                "SELECT * FROM votes WHERE mongo_user_id = %s AND reply_id = %s",
                (mongo_user_id, reply_id),
            )
        row = cur.fetchone()
    return dict(row) if row else None


def create_vote(mongo_user_id: str, post_id: int | None, reply_id: int | None) -> dict | None:
    """
    Create a vote.  Returns the created row, or None if a duplicate vote exists
    (caller should treat this as a no-op, not an error).
    """
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO votes (mongo_user_id, post_id, reply_id)
                VALUES (%s, %s, %s)
                RETURNING *
                """,
                (mongo_user_id, post_id, reply_id),
            )
            row = cur.fetchone()
            conn.commit()
        return dict(row)
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return None


def delete_vote(mongo_user_id: str, post_id: int | None, reply_id: int | None) -> bool:
    conn = get_db()
    with conn.cursor() as cur:
        if post_id is not None:
            cur.execute(
                "DELETE FROM votes WHERE mongo_user_id = %s AND post_id = %s RETURNING id",
                (mongo_user_id, post_id),
            )
        else:
            cur.execute(
                "DELETE FROM votes WHERE mongo_user_id = %s AND reply_id = %s RETURNING id",
                (mongo_user_id, reply_id),
            )
        deleted = cur.fetchone()
        conn.commit()
    return bool(deleted)
