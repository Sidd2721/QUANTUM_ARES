# backend/app/parsers/__init__.py
"""
Parser module — P1 replaces this with real multi-format parser on Day 3.
Stub implements JSON parsing only (sufficient for demo_hospital.json).

Output: {'nodes': [...], 'edges': [...], 'evidence_source': str}
"""

import json
import logging

logger = logging.getLogger(__name__)


class ParseError(Exception):
    pass


def parse_input(raw_text: str, filename: str = '') -> dict:
    fn = filename.lower()

    if fn.endswith('.yaml') or fn.endswith('.yml'):
        logger.warning('[PARSER] YAML format — stub returns minimal graph')
        return _minimal_graph('yaml')

    if fn.endswith('.tf') or fn.endswith('.hcl'):
        logger.warning('[PARSER] Terraform format — stub returns minimal graph')
        return _minimal_graph('terraform')

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ParseError(f'Invalid JSON: {e}')

    nodes = data.get('nodes', [])
    edges = data.get('edges', [])

    if not nodes:
        raise ParseError('At least one node is required')
    if len(nodes) > 200:
        raise ParseError(f'Graph exceeds 200-node limit (got {len(nodes)})')

    node_ids = set()
    for n in nodes:
        if not n.get('id'):
            raise ParseError('Every node must have an id field')
        if n['id'] in node_ids:
            raise ParseError(f'Duplicate node id: {n["id"]}')
        node_ids.add(n['id'])

    for e in edges:
        if e.get('source') == e.get('target'):
            raise ParseError(f'Self-loop on node "{e.get("source")}"')
        if e.get('source') not in node_ids:
            raise ParseError(f'Edge source "{e.get("source")}" not in nodes')
        if e.get('target') not in node_ids:
            raise ParseError(f'Edge target "{e.get("target")}" not in nodes')

    evidence = data.get('evidence_source', 'json')
    logger.info(f'[PARSER] Parsed {len(nodes)} nodes, {len(edges)} edges | source: {evidence}')
    return {'nodes': nodes, 'edges': edges, 'evidence_source': evidence}


def _minimal_graph(source: str) -> dict:
    return {
        'nodes': [{'id': 'stub_node', 'type': 'unknown', 'zone': 'INTERNAL',
                   'data_sensitivity': 'LOW', 'encryption_type': 'unknown'}],
        'edges': [],
        'evidence_source': source
    }
