"""
Multi-signal retrieval ranking model for re-scoring RAG candidates.

After the RAG stage returns candidates sorted by semantic similarity,
this module re-ranks them using a weighted linear combination of signals:

    final_score = w_rel  * relevance_score    (semantic similarity from embedding)
                + w_price * price_fit_score    (budget adherence, inverted price)
                + w_avail * availability_score (inventory depth normalised)
                + w_kind  * kind_bonus         (preferred category boost)

The weights are calibrated on domain query-item pairs from the Kayak
travel dataset and can be overridden per-request for A/B testing.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Default weight vector — calibrated on domain query-item pairs
DEFAULT_WEIGHTS: Dict[str, float] = {
    "relevance": 0.55,
    "price_fit": 0.25,
    "availability": 0.15,
    "kind_bonus": 0.05,
}


def _min_max_norm(value: float, min_v: float, max_v: float) -> float:
    """Normalise a value to [0, 1] using min-max scaling."""
    if max_v == min_v:
        return 0.5
    return max(0.0, min(1.0, (value - min_v) / (max_v - min_v)))


def rank_candidates(
    candidates: List[Dict[str, Any]],
    budget: Optional[float] = None,
    preferred_kind: Optional[str] = None,
    weights: Optional[Dict[str, float]] = None,
) -> List[Dict[str, Any]]:
    """
    Re-rank RAG candidates using a composite multi-signal scoring model.

    Args:
        candidates:     Output from retrieve_relevant_inventory — list of deal
                        dicts, each containing a ``similarity_score`` field.
        budget:         Optional user budget in USD. Over-budget items receive
                        a 5x penalty on their price_fit score.
        preferred_kind: Optional preferred category ('flight', 'hotel', 'car').
                        Matching items receive a kind_bonus boost.
        weights:        Optional weight override dict. Keys must match
                        DEFAULT_WEIGHTS. Missing keys fall back to defaults.

    Returns:
        Candidates sorted by ``ranking_score`` descending, with the score
        added to each dict.
    """
    if not candidates:
        return []

    w = {**DEFAULT_WEIGHTS, **(weights or {})}

    prices = [float(c.get("price") or 0) for c in candidates]
    availabilities = [float(c.get("availability") or 0) for c in candidates]

    min_p, max_p = min(prices), max(prices)
    min_a, max_a = min(availabilities), max(availabilities)

    ranked: List[Dict[str, Any]] = []
    for c in candidates:
        # Signal 1: semantic relevance from RAG embedding stage
        relevance = float(c.get("similarity_score") or 0)

        # Signal 2: price fitness — lower price is better
        price = float(c.get("price") or 0)
        price_fit = 1.0 - _min_max_norm(price, min_p, max_p)
        if budget and price > budget:
            price_fit *= 0.2  # heavy penalty for over-budget items

        # Signal 3: availability — more stock means lower booking risk
        avail = float(c.get("availability") or 0)
        avail_norm = _min_max_norm(avail, min_a, max_a)

        # Signal 4: category preference boost
        kind_bonus = 1.0 if (preferred_kind and c.get("kind") == preferred_kind) else 0.0

        final = (
            w["relevance"] * relevance
            + w["price_fit"] * price_fit
            + w["availability"] * avail_norm
            + w["kind_bonus"] * kind_bonus
        )

        ranked.append({**c, "ranking_score": round(final, 4)})

    ranked.sort(key=lambda x: x["ranking_score"], reverse=True)

    if ranked:
        logger.debug(
            "Ranked %d candidates; top: kind=%s score=%.4f price=$%.0f",
            len(ranked),
            ranked[0].get("kind", "?"),
            ranked[0]["ranking_score"],
            float(ranked[0].get("price") or 0),
        )

    return ranked
