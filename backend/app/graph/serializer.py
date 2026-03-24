# backend/app/graph/serializer.py
"""Graph serialiser — converts between NetworkX DiGraph and JSON dict."""

import networkx as nx


def graph_to_json(G: nx.DiGraph) -> dict:
    return {
        'nodes': [
            {'id': n, **{k: v for k, v in attrs.items() if k != 'id'}}
            for n, attrs in G.nodes(data=True)
        ],
        'edges': [
            {'source': u, 'target': v, **d}
            for u, v, d in G.edges(data=True)
        ]
    }


def json_to_graph(data: dict) -> nx.DiGraph:
    G = nx.DiGraph()
    for node in data.get('nodes', []):
        nid = node['id']
        G.add_node(nid, **{k: v for k, v in node.items() if k != 'id'})
    for edge in data.get('edges', []):
        G.add_edge(
            edge['source'], edge['target'],
            **{k: v for k, v in edge.items() if k not in ('source', 'target')}
        )
    return G
