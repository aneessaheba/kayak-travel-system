"""
RAG (Retrieval-Augmented Generation) pipeline for the AI travel concierge.

Retrieves semantically relevant travel deals from MongoDB using
Google text-embedding-004 embeddings and cosine similarity search.
Embeddings are cached in Redis to avoid redundant API calls on repeated queries.
"""

import hashlib
import json
import logging
import math
from typing import Any, Dict, List, Optional

from pymongo import MongoClient

from .config import settings

logger = logging.getLogger(__name__)


# ── Cosine similarity (pure Python, no numpy dependency) ─────────────────────

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── Google embedding API ──────────────────────────────────────────────────────

def _embed(text: str, api_key: str, task_type: str = "retrieval_document") -> Optional[List[float]]:
    """Generate a text embedding using Google text-embedding-004."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Embedding failed (%s): %s", task_type, exc)
        return None


# ── Redis embedding cache ─────────────────────────────────────────────────────

def _cache_key(text: str) -> str:
    return "rag:embed:" + hashlib.md5(text.encode()).hexdigest()


async def _get_cached(key: str, redis_client) -> Optional[List[float]]:
    if redis_client is None:
        return None
    try:
        val = await redis_client.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def _set_cached(key: str, vec: List[float], redis_client, ttl: int = 3600) -> None:
    if redis_client is None:
        return
    try:
        await redis_client.setex(key, ttl, json.dumps(vec))
    except Exception:
        pass


# ── Inventory text serialisation ─────────────────────────────────────────────

def _deal_to_text(deal: Dict[str, Any]) -> str:
    """Convert a deal document to a plain-text description for embedding."""
    kind = (deal.get("kind") or "deal").upper()
    title = deal.get("title") or ""
    origin = deal.get("origin") or ""
    dest = deal.get("destination") or deal.get("hotel_location") or ""
    price = deal.get("price", 0)
    tags = ", ".join(deal.get("tags") or [])
    route = f"{origin} → {dest}".strip(" →") if (origin or dest) else ""
    parts = [f"{kind}: {title}"] if title else [kind]
    if route:
        parts.append(f"Route: {route}")
    parts.append(f"Price: ${price}")
    if tags:
        parts.append(f"Tags: {tags}")
    return ". ".join(parts) + "."


# ── Main retrieval entry point ────────────────────────────────────────────────

async def retrieve_relevant_inventory(
    query: str,
    api_key: str,
    redis_client=None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Retrieve the top-k most semantically relevant travel deals for a query.

    Pipeline:
      1. Embed the user query using the retrieval_query task type.
      2. Load up to 200 deals from agent_db.deals (populated by the ingest loop).
      3. For each deal, retrieve its document embedding from Redis or generate
         a new one via the Google embedding API and cache it for 1 hour.
      4. Score every deal by cosine similarity against the query embedding.
      5. Return top-k candidates sorted by similarity score descending.
    """
    if not api_key:
        return []

    # Step 1 — embed the query
    query_vec = _embed(query, api_key, task_type="retrieval_query")
    if not query_vec:
        return []

    # Step 2 — fetch inventory from MongoDB
    try:
        client = MongoClient(settings.mongodb_uri)
        deals = list(client[settings.mongodb_db]["deals"].find({}, {"_id": 0}).limit(200))
        client.close()
    except Exception as exc:
        logger.error("MongoDB inventory fetch failed: %s", exc)
        return []

    if not deals:
        return []

    # Steps 3 & 4 — embed each deal (cache-aside) and score
    scored: List[Dict[str, Any]] = []
    for deal in deals:
        text = _deal_to_text(deal)
        key = _cache_key(text)

        vec = await _get_cached(key, redis_client)
        if vec is None:
            vec = _embed(text, api_key, task_type="retrieval_document")
            if vec:
                await _set_cached(key, vec, redis_client)

        if vec:
            sim = _cosine_similarity(query_vec, vec)
            scored.append({**deal, "similarity_score": round(sim, 4), "_text": text})

    # Step 5 — return top-k
    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    top = scored[:top_k]

    logger.info(
        "RAG retrieved %d candidates from %d deals (top score=%.4f)",
        len(top), len(deals), top[0]["similarity_score"] if top else 0,
    )
    return top


def format_rag_context(candidates: List[Dict[str, Any]]) -> str:
    """Format ranked candidates as a context block for the LLM prompt."""
    if not candidates:
        return ""
    lines = [
        f"[{c.get('kind', 'deal').upper()} | relevance={c.get('ranking_score', c.get('similarity_score', 0)):.3f}]"
        f" {c.get('_text', '')}"
        for c in candidates
    ]
    return "Live inventory context (ranked by relevance):\n" + "\n".join(lines)
