# parsers/json_parser.py

import json
from typing import Dict


class ParseError(Exception):
    pass


ALLOWED_ZONES = {'PUBLIC', 'DMZ', 'INTERNAL', 'PRIVATE', 'RESTRICTED'}
ALLOWED_SENSITIVITY = {'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'}


def parse_json(raw_text: str) -> Dict:
    """
    Parses and validates JSON input.
    """

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ParseError(f"Invalid JSON: {e}")

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    if not nodes:
        raise ParseError("At least one node is required")

    if len(nodes) > 200:
        raise ParseError(f"Graph exceeds 200-node limit (got {len(nodes)})")

    node_ids = set()

    # Validate nodes
    for node in nodes:
        node_id = node.get("id")

        if not node_id:
            raise ParseError("Each node must have an 'id'")

        if node_id in node_ids:
            raise ParseError(f"Duplicate node id: {node_id}")

        node_ids.add(node_id)

        if "zone" in node and node["zone"] not in ALLOWED_ZONES:
            raise ParseError(f"Invalid zone '{node['zone']}' in node '{node_id}'")

        if "data_sensitivity" in node and node["data_sensitivity"] not in ALLOWED_SENSITIVITY:
            raise ParseError(f"Invalid sensitivity in node '{node_id}'")

    # Validate edges
    for edge in edges:
        src = edge.get("source")
        tgt = edge.get("target")

        if src == tgt:
            raise ParseError(f"Self-loop detected on node '{src}'")

        if src not in node_ids:
            raise ParseError(f"Edge source '{src}' not found")

        if tgt not in node_ids:
            raise ParseError(f"Edge target '{tgt}' not found")

    evidence = data.get("evidence_source", "json")

    return {
        "nodes": nodes,
        "edges": edges,
        "evidence_source": evidence
    }