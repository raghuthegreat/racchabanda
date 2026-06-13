"""Definition model — plain psycopg2 queries."""

import psycopg2.extras
from racchabanda.db import get_db


def get_definitions_for_post(post_id: int) -> list[dict]:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, post_id, mongo_user_id, definition, example,
                   region, is_top_answer, created_at
            FROM definitions
            WHERE post_id = %s
            ORDER BY is_top_answer DESC, created_at ASC
            """,
            (post_id,),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_definition_by_id(definition_id: int) -> dict | None:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, post_id, mongo_user_id, definition, example,
                   region, is_top_answer, created_at
            FROM definitions
            WHERE id = %s
            """,
            (definition_id,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def create_definition(
    post_id: int,
    mongo_user_id: str,
    definition: str,
    example: str | None,
    region: str | None,
) -> dict:
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO definitions (post_id, mongo_user_id, definition, example, region)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (post_id, mongo_user_id, definition, example, region),
        )
        row = cur.fetchone()
        conn.commit()
    return dict(row)


def set_top_answer(definition_id: int, post_id: int) -> dict | None:
    """
    Mark one definition as the top answer for a post, clearing the flag on
    all others belonging to the same post.
    """
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Clear existing top answer for this post
        cur.execute(
            "UPDATE definitions SET is_top_answer = FALSE WHERE post_id = %s",
            (post_id,),
        )
        # Set the new top answer
        cur.execute(
            """
            UPDATE definitions
            SET is_top_answer = TRUE
            WHERE id = %s
            RETURNING *
            """,
            (definition_id,),
        )
        row = cur.fetchone()
        conn.commit()
    return dict(row) if row else None
