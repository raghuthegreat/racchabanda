"""Post model — plain psycopg2 queries."""

import psycopg2.extras
from ..db import get_db
from flask import current_app


def _build_post_filter(category_id=None, region=None, post_type=None, status=None):
    """Return (where_clause, params_list) for post list queries."""
    conditions = []
    params = []

    if category_id is not None:
        conditions.append("p.category_id = %s")
        params.append(category_id)

    if region:
        conditions.append("p.region = %s")
        params.append(region)

    if post_type:
        conditions.append("p.post_type = %s")
        params.append(post_type)

    if status:
        conditions.append("p.status = %s")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    return where, params


def get_posts(category_id=None, region=None, post_type=None, status=None, page=1) -> tuple[list[dict], int]:
    """
    Return (posts, total_count) with vote_count and reply_count included.
    """
    page_size = current_app.config["PAGE_SIZE"]
    offset = (page - 1) * page_size

    where, params = _build_post_filter(category_id, region, post_type, status)

    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Total count
        cur.execute(f"SELECT COUNT(*) FROM posts p {where}", params)
        total = cur.fetchone()["count"]

        # Paginated rows with aggregated counts
        cur.execute(
            f"""
            SELECT
                p.id, p.category_id, p.mongo_user_id, p.title, p.body,
                p.image_url, p.post_type, p.status, p.region,
                p.word, p.word_telugu, p.yaasalu_word_url,
                p.is_pinned, p.created_at, p.updated_at,
                COUNT(DISTINCT v.id) AS vote_count,
                COUNT(DISTINCT r.id) AS reply_count
            FROM posts p
            LEFT JOIN votes v ON v.post_id = p.id
            LEFT JOIN replies r ON r.post_id = p.id
            {where}
            GROUP BY p.id
            ORDER BY p.is_pinned DESC, p.created_at DESC
            LIMIT %s OFFSET %s
            """,
            params + [page_size, offset],
        )
        rows = cur.fetchall()

    return [dict(r) for r in rows], total


def get_post_by_id(post_id: int) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                p.id, p.category_id, p.mongo_user_id, p.title, p.body,
                p.image_url, p.post_type, p.status, p.region,
                p.word, p.word_telugu, p.yaasalu_word_url,
                p.is_pinned, p.created_at, p.updated_at,
                COUNT(DISTINCT v.id) AS vote_count,
                COUNT(DISTINCT r.id) AS reply_count
            FROM posts p
            LEFT JOIN votes v ON v.post_id = p.id
            LEFT JOIN replies r ON r.post_id = p.id
            WHERE p.id = %s
            GROUP BY p.id
            """,
            (post_id,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def create_post(
    category_id: int,
    mongo_user_id: str,
    title: str,
    body: str | None,
    image_url: str | None,
    post_type: str,
    region: str | None,
    word: str | None,
    word_telugu: str | None,
) -> dict:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO posts
                (category_id, mongo_user_id, title, body, image_url,
                 post_type, region, word, word_telugu)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (category_id, mongo_user_id, title, body, image_url,
             post_type, region, word, word_telugu),
        )
        row = cur.fetchone()
        conn.commit()
    post = dict(row)
    post.setdefault("vote_count", 0)
    post.setdefault("reply_count", 0)
    return post


def update_post(post_id: int, fields: dict) -> dict | None:
    """
    Update allowed fields on a post (admin-only fields: status,
    yaasalu_word_url, is_pinned).  Returns updated post or None.
    """
    allowed = {"status", "yaasalu_word_url", "is_pinned", "title", "body", "image_url"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return get_post_by_id(post_id)

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [post_id]

    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE posts SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING id",
            values,
        )
        row = cur.fetchone()
        conn.commit()

    if not row:
        return None
    return get_post_by_id(post_id)
