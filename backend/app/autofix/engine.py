# backend/app/autofix/engine.py
"""
AutoFix Engine — matches findings to expert-verified patch templates.

Generates downloadable Terraform/IAM/K8s patches per finding.
Sorted by score_impact descending (biggest wins first).
One patch per (rule_id, node_id) pair — no duplicates.

Demo moment (4:30 in 7-minute script):
  "One click. Expert-written Terraform to enable encryption.
   Single line to upgrade nginx. IAM policy to add MFA.
   Download, apply, and your score goes from 34 to 79."

Called at Stage 7 of pipeline/runner.py. runner.py already has
the import with try/except fallback — no runner.py changes needed.
"""
import json
import copy
import logging
from pathlib import Path
from typing import List, Dict

logger = logging.getLogger(__name__)

# Load templates at module import time (cached for all requests)
_TEMPLATE_PATH = Path(__file__).parent / 'templates.json'
try:
    _TEMPLATES: Dict = json.loads(_TEMPLATE_PATH.read_text(encoding='utf-8'))
    logger.info(f'[AUTOFIX] Loaded {len(_TEMPLATES)} patch templates: {list(_TEMPLATES.keys())}')
except Exception as e:
    _TEMPLATES = {}
    logger.error(f'[AUTOFIX] Failed to load templates.json: {e}')


def generate_auto_fixes(findings: List[Dict], G=None) -> List[Dict]:
    """
    Generates auto-fix patches for findings that have a matching template.

    Algorithm:
      1. Sort findings by CVSS descending (most severe first)
      2. For each finding, take first affected_node
      3. If (rule_id, node_id) not seen AND rule_id in templates:
         - Deep copy template
         - Fill {node_id} and {fix_version} placeholders
         - Attach metadata: affected_node, rule_id, severity, cvss
      4. Sort patches by score_impact integer descending

    Returns: List[patch_dict] sorted by score_impact descending
    """
    patches = []
    seen    = set()  # (rule_id, node_id) — prevents duplicates

    sorted_findings = sorted(findings, key=lambda x: -x.get('cvss', 0))

    for finding in sorted_findings:
        rule_id = finding.get('rule_id', '')
        if rule_id not in _TEMPLATES:
            continue

        affected_nodes = finding.get('affected_nodes', [])
        node_id = affected_nodes[0] if affected_nodes else 'unknown_node'

        key = (rule_id, node_id)
        if key in seen:
            continue
        seen.add(key)

        patch        = copy.deepcopy(_TEMPLATES[rule_id])
        fix_version  = finding.get('fix_version', 'latest')
        patch        = _fill_placeholders(patch, node_id, fix_version)

        patch['affected_node'] = node_id
        patch['rule_id']       = rule_id
        patch['severity']      = finding.get('severity', 'LOW')
        patch['cvss']          = finding.get('cvss', 0)

        patches.append(patch)

    patches.sort(key=_sort_key, reverse=True)

    logger.info(f'[AUTOFIX] Generated {len(patches)} patches from {len(findings)} findings')
    return patches


def _sort_key(p: dict) -> int:
    """Extract integer score_impact for sorting. '+40' -> 40, '+0' -> 0."""
    raw = p.get('score_impact', '+0')
    try:
        return int(str(raw).replace('+', '').strip())
    except (ValueError, TypeError):
        return 0


def _fill_placeholders(obj, node_id: str, fix_version: str):
    """
    Recursively replace {node_id} and {fix_version} in all string values.
    Handles dicts, lists, and strings at any nesting depth.
    """
    if isinstance(obj, str):
        return obj.replace('{node_id}', node_id).replace('{fix_version}', fix_version)
    elif isinstance(obj, dict):
        return {k: _fill_placeholders(v, node_id, fix_version) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_fill_placeholders(item, node_id, fix_version) for item in obj]
    return obj
