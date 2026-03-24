# backend/app/engines/zero_trust.py
"""
Zero Trust Engine — one line. All logic is in rules.py RULE_REGISTRY.
"""
import networkx as nx
from typing import List, Dict, Tuple
from .rules import evaluate_rules, RULE_REGISTRY


def zero_trust_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Evaluates all rules in RULE_REGISTRY against graph G.
    To add a new rule: edit rules.py only. This function never changes.
    Returns: (findings, zt_score)
    """
    return evaluate_rules(G, RULE_REGISTRY)
