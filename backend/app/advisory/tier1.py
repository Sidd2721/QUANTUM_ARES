# backend/app/advisory/tier1.py
"""
Tier-1 AI Advisory — rapidfuzz fuzzy matching against 20 curated templates.

Response time: < 50ms (all in-memory, no DB query).
Match threshold: 80 (WRatio score).
Returns: dict | None (None triggers Tier-2 FTS5 search fallback).

Demo moment (5:10): "50 milliseconds. Deterministic. Cites NIST FIPS 203.
No LLM — no hallucination. An RBI auditor can open that document and
verify every word. That is not AI magic — that is auditable intelligence."
"""
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Load templates at import time (module-level cache — load once, serve forever)
_TEMPLATE_PATH = Path(__file__).parent.parent / 'data' / 'ai_templates.json'
try:
    _TEMPLATES = json.loads(_TEMPLATE_PATH.read_text(encoding='utf-8'))
    logger.info(f'[TIER1] Loaded {len(_TEMPLATES)} templates from ai_templates.json')
except Exception as e:
    _TEMPLATES = []
    logger.error(f'[TIER1] Failed to load ai_templates.json: {e}')


def tier1_answer(question: str) -> Optional[dict]:
    """
    Fuzzy-match question against 20 templates using rapidfuzz WRatio.
    Returns answer dict if best match score >= 80, else None.

    None return triggers Tier-2 FTS5 search in advisory/tier2.py.
    """
    if not _TEMPLATES or not question.strip():
        return None

    try:
        from rapidfuzz import fuzz, process
    except ImportError:
        logger.error('[TIER1] rapidfuzz not installed — pip install rapidfuzz')
        return None

    questions = [t['question'] for t in _TEMPLATES]
    result = process.extractOne(question, questions, scorer=fuzz.WRatio)

    if result is None:
        return None

    best_match, score, idx = result
    if score < 80:
        return None

    tmpl = _TEMPLATES[idx]
    logger.debug(f'[TIER1] Match: "{best_match}" score={score}')

    return {
        'answer':      tmpl['answer'],
        'tier':        'rule_engine',
        'source':      tmpl['source'],
        'match_score': score,
        'matched_question': best_match,
    }
