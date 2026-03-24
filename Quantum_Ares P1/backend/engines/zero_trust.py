# engines/zero_trust.py

import networkx as nx
from typing import List, Dict, Tuple
from .rules import evaluate_rules, RULE_REGISTRY


def zero_trust_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Runs all Zero Trust rules defined in RULE_REGISTRY.
    Returns findings + score (0–100).
    """
    return evaluate_rules(G, RULE_REGISTRY)