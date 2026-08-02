"""Title normalization for scanner display names and metadata search queries.

Shared between the scanner (improving display names) and the metadata
system (cleaning search queries before sending to IGDB).
"""

from __future__ import annotations

import re


# Suffixes stripped from executable stems and folder names before display or search.
_REMOVABLE_SUFFIXES = (
    "launcher",
    "shipping",
    "win64",
    "win32",
    "x64",
    "x86",
    "dx11",
    "dx12",
    "vulkan",
    "demo",
    "beta",
    "alpha",
    "remastered",
    "definitive edition",
    "ultimate edition",
    "complete edition",
    "game of the year",
    "goty",
    "goty edition",
    "special edition",
    "deluxe edition",
    "standard edition",
    "gold edition",
)

_SUFFIX_PATTERN = re.compile(
    r"\b(?:" + "|".join(re.escape(s) for s in _REMOVABLE_SUFFIXES) + r")\b",
    re.IGNORECASE,
)

# Splits CamelCase and PascalCase into separate words.
_CAMEL_SPLIT = re.compile(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")

# Collapse whitespace.
_MULTI_SPACE = re.compile(r"\s+")

# Non-alphanumeric characters (keep spaces).
_NON_ALNUM = re.compile(r"[^a-zA-Z0-9\s]")


def derive_display_name(executable_path: str, install_folder: str | None) -> str:
    """Derive a human-friendly display name for a scanned game.

    Uses the executable stem as the stable scanner-facing name, preserving
    the existing import-review contract.  Folder names are only a fallback
    for unusual executable names that normalize to an empty value.
    """
    from pathlib import Path

    exe_stem = Path(executable_path).stem
    generic_folders = {
        "bin", "binaries", "x64", "x86", "win64", "win32", "game", "games",
        "runtime", "dist", "build", "release", "debug", "app", "application",
    }

    cleaned_stem = _clean_display_name(exe_stem)
    if cleaned_stem:
        return cleaned_stem

    if install_folder:
        folder_name = Path(install_folder).name
        if folder_name and folder_name.casefold() not in generic_folders:
            return _clean_display_name(folder_name)
    return exe_stem


def normalize_for_search(title: str) -> str:
    """Normalize a game title into a clean IGDB search query.

    Strips common suffixes, expands CamelCase, removes punctuation,
    and collapses whitespace.
    """
    cleaned = _SUFFIX_PATTERN.sub("", title)
    cleaned = _CAMEL_SPLIT.sub(" ", cleaned)
    cleaned = cleaned.replace("-", " ").replace("_", " ")
    cleaned = _NON_ALNUM.sub("", cleaned)
    cleaned = _MULTI_SPACE.sub(" ", cleaned).strip()
    return cleaned


def _clean_display_name(raw: str) -> str:
    """Clean a raw folder or stem name into a presentable title."""
    # Expand CamelCase: 'DevilMayCry4' → 'Devil May Cry 4'
    expanded = _CAMEL_SPLIT.sub(" ", raw)
    # Replace dashes and underscores with spaces.
    expanded = expanded.replace("-", " ").replace("_", " ")
    # Remove removable suffixes for display.
    expanded = _SUFFIX_PATTERN.sub("", expanded)
    # Collapse whitespace and trim.
    expanded = _MULTI_SPACE.sub(" ", expanded).strip()
    return expanded if expanded else raw
