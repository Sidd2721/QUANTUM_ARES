# backend/app/graph/builder.py
"""
Graph builder — P2 replaces this with real implementation on Day 3.
Stub: creates a real DiGraph with all nodes and edges from parsed data.
"""

import networkx as nx
import logging

logger = logging.getLogger(__name__)


def build_graph(data: dict) -> nx.DiGraph:
    G = nx.DiGraph()

    for node in data.get('nodes', []):
        nid = node['id']
        G.add_node(
            nid,
            name=node.get('name', nid),
            type=node.get('type', 'unknown'),
            zone=node.get('zone', 'INTERNAL'),
            data_sensitivity=node.get('data_sensitivity', 'LOW'),
            encryption_type=node.get('encryption_type', 'unknown'),
            retention_years=int(node.get('retention_years', 0)),
            container_image=node.get('container_image'),
            iam_roles=node.get('iam_roles', []),
            cvss_live=0.0,
            blast_radius=0.0,
            cve_id=None,
            known_exploit=node.get('known_exploit', False)
        )

    for edge in data.get('edges', []):
        G.add_edge(
            edge['source'],
            edge['target'],
            auth_required=edge.get('auth_required', False),
            mfa_required=edge.get('mfa_required', False),
            tls_enforced=edge.get('tls_enforced', False),
            access_scope=edge.get('access_scope', 'SCOPED'),
            protocol=edge.get('protocol', 'unknown'),
            trust_level=edge.get('trust_level', 'LOW'),
            per_session_auth=edge.get('per_session_auth', False),
            explicit_auth=edge.get('explicit_auth', False),
            least_privilege=edge.get('least_privilege', False)
        )

    logger.info(f'[GRAPH] Built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')
    return G
