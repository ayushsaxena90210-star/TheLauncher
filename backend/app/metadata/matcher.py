"""Metadata matching — compares game titles against provider search results.

Uses normalized string comparison with confidence scoring.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .provider import MetadataResult


_ARTICLES = re.compile(r"\b(the|a|an)\b", re.IGNORECASE)
_NON_ALNUM = re.compile(r"[^a-z0-9\s]")
_MULTI_SPACE = re.compile(r"\s+")

# Roman numeral mapping for common game sequel numbers.
_ROMAN = {
    "i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5",
    "vi": "6", "vii": "7", "viii": "8", "ix": "9", "x": "10",
    "xi": "11", "xii": "12", "xiii": "13", "xiv": "14", "xv": "15",
}


@dataclass
class MatchResult:
    """The best match found for a query title."""

    result: MetadataResult
    confidence: float


def _normalize(text: str) -> str:
    """Reduce a title to a canonical comparison form."""
    lower = text.casefold()
    lower = _ARTICLES.sub("", lower)
    lower = _NON_ALNUM.sub(" ", lower)
    lower = _MULTI_SPACE.sub(" ", lower).strip()
    # Expand roman numerals.
    tokens = lower.split()
    tokens = [_ROMAN.get(t, t) for t in tokens]
    return " ".join(tokens)


def _token_overlap(a: str, b: str) -> float:
    """Compute Jaccard-style token overlap between two normalized strings."""
    set_a = set(a.split())
    set_b = set(b.split())
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


def best_match(query_title: str, results: list[MetadataResult]) -> MatchResult | None:
    """Find the best matching result for *query_title*.

    Returns the highest-confidence match ≥ 0.5, or ``None`` if nothing
    matches well enough.
    """
    if not results:
        return None

    norm_query = _normalize(query_title)
    if not norm_query:
        return None

    best: MatchResult | None = None

    for result in results:
        norm_result = _normalize(result.title)

        # Exact match (case-insensitive, normalized).
        if norm_query == norm_result:
            confidence = 1.0
        # One contains the other.
        elif norm_query in norm_result or norm_result in norm_query:
            # Shorter one contains longer one → strong partial match.
            longer = max(len(norm_query), len(norm_result))
            shorter = min(len(norm_query), len(norm_result))
            confidence = 0.7 + 0.25 * (shorter / longer)
        else:
            # Token overlap.
            overlap = _token_overlap(norm_query, norm_result)
            confidence = overlap * 0.8

        if confidence >= 0.5 and (best is None or confidence > best.confidence):
            best = MatchResult(result=result, confidence=confidence)

    return best
