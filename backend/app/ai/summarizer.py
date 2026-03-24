# backend/app/ai/summarizer.py
"""
Attack Story generator + Executive Summary builder.

build_attack_story() converts a raw node path into a human-readable
attack narrative. No LLM — deterministic template with graph attributes.

executive_summary() produces the CISO-facing summary card shown in the UI.
"""
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


def build_attack_story(finding: Dict, G=None) -> str:
    """
    Converts an attack path finding into a plain English attack narrative.

    Example output:
    "An attacker gains initial access through the gateway 'internet_gateway',
     pivots laterally through 'web_server', 'app_server', and compromises
     the database 'patient_db' containing CRITICAL-sensitivity data.
     This is a 3-hop chain requiring no exploit — only misconfiguration."
    """
    path = finding.get('affected_nodes', []) if isinstance(finding, dict) else finding
    if not path:
        return 'Empty attack path.'
    if len(path) < 2:
        return f'Single-node exposure at "{path[0]}".'

    entry  = path[0]
    target = path[-1]
    middle = path[1:-1]

    # Get node attributes (G may be None for stub calls or API endpoints)
    def _attr(node, key, default='node'):
        if isinstance(finding, dict) and key == 'type' and node == entry: return finding.get('entry_type', default)
        if isinstance(finding, dict) and key == 'type' and node == target: return finding.get('target_type', default)
        if isinstance(finding, dict) and key == 'data_sensitivity' and node == target: return finding.get('target_sens', default)
        if G is not None and node in G.nodes:
            return G.nodes[node].get(key, default)
        return default

    entry_type  = _attr(entry,  'type', 'node')
    target_type = _attr(target, 'type', 'node')
    target_sens = _attr(target, 'data_sensitivity', 'UNKNOWN')

    story = f'An attacker gains initial access through the {entry_type} "{entry}"'

    if middle:
        pivot_desc = ', '.join(f'"{m}"' for m in middle)
        story += f', pivots laterally through {pivot_desc}'

    story += (
        f', and compromises the {target_type} "{target}" '
        f'containing {target_sens}-sensitivity data. '
        f'This is a {len(path)-1}-hop chain requiring no exploit — only misconfiguration.'
    )

    return story


def executive_summary(
    findings: List[Dict],
    security_index: int,
    score_breakdown: Dict
) -> Dict:
    """
    CISO-facing plain English summary. First thing a non-technical executive sees.

    Produces:
      risk_level      → CRITICAL | HIGH | MEDIUM | LOW
      critical_count  → number of CRITICAL severity findings
      high_count      → number of HIGH severity findings
      attack_paths    → number of attack_path plugin findings
      main_risk       → top finding's ai_opinion.reason
      primary_action  → one sentence recommended action
      score_breakdown → from scoring.py
      attack_stories  → up to 3 plain English attack narratives
    """
    critical     = [f for f in findings if f.get('severity') == 'CRITICAL']
    high         = [f for f in findings if f.get('severity') == 'HIGH']
    attack_paths = [f for f in findings if f.get('engine') == 'attack_path']

    top = critical[0] if critical else (high[0] if high else None)
    main_risk = (
        top['ai_opinion']['reason']
        if top and 'ai_opinion' in top
        else 'No critical issues detected.'
    )

    if attack_paths:
        primary_action = f'Block {len(attack_paths)} attack path(s) by adding authentication and network segmentation.'
    elif critical:
        primary_action = f'Address {len(critical)} critical violation(s) immediately — see Auto-Fix patches.'
    else:
        primary_action = 'Review high-severity findings and apply recommended remediations.'

    risk_level = (
        'CRITICAL' if security_index < 40 else
        ('HIGH'    if security_index < 60 else
        ('MEDIUM'  if security_index < 80 else 'LOW'))
    )

    # Build attack stories for top attack path findings
    attack_stories = []
    for f in attack_paths[:3]:
        nodes = f.get('affected_nodes', [])
        if len(nodes) >= 2:
            attack_stories.append(build_attack_story(f, None))

    logger.info(
        f'[SUMMARIZER] Index:{security_index} | Risk:{risk_level} | '
        f'CRITICAL:{len(critical)} HIGH:{len(high)} Paths:{len(attack_paths)}'
    )

    return {
        'security_index':   security_index,
        'risk_level':       risk_level,
        'critical_count':   len(critical),
        'high_count':       len(high),
        'attack_paths':     len(attack_paths),
        'main_risk':        main_risk,
        'recommendation':   primary_action,
        'score_breakdown':  score_breakdown,
        'attack_stories':   attack_stories,
    }
