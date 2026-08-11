"""Reply model — plain psycopg2 queries."""

import psycopg2.extras
from racchabanda.db import get_db


def get_replies_for_post(post_id: int) -> list[dict]:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                r.id, r.post_id, r.mongo_user_id, r.body,
                r.is_admin_reply, r.created_at,
                COUNT(v.id) AS vote_count
            FROM replies r
            LEFT JOIN votes v ON v.reply_id = r.id
            WHERE r.post_id = %s
            GROUP BY r.id
            ORDER BY r.created_at ASC
            """,
            (post_id,),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_reply_by_id(reply_id: int) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, post_id, mongo_user_id, body, is_admin_reply, created_at
            FROM replies
            WHERE id = %s
            """,
            (reply_id,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def create_reply(
    post_id: int,
    mongo_user_id: str,
    body: str,
    is_admin_reply: bool = False,
) -> dict:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO replies (post_id, mongo_user_id, body, is_admin_reply)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (post_id, mongo_user_id, body, is_admin_reply),
        )
        row = cur.fetchone()
        conn.commit()
    reply = dict(row)
    reply.setdefault("vote_count", 0)
    return reply


def delete_reply(reply_id: int) -> bool:
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM replies WHERE id = %s RETURNING id", (reply_id,))
        deleted = cur.fetchone()
        conn.commit()
    return bool(deleted)
