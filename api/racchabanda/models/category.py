"""Category model — plain psycopg2 queries."""

import psycopg2.extras
from ..db import get_db


def row_to_dict(row) -> dict:
    return dict(row)


def get_all_categories() -> list[dict]:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, name_telugu, slug, type, region, description, created_at
            FROM categories
            ORDER BY id
            """
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_category_by_slug(slug: str) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, name_telugu, slug, type, region, description, created_at
            FROM categories
            WHERE slug = %s
            """,
            (slug,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def get_category_by_id(category_id: int) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, name_telugu, slug, type, region, description, created_at
            FROM categories
            WHERE id = %s
            """,
            (category_id,),
        )
        row = cur.fetchone()
    return dict(row) if row else None
