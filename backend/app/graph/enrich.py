# backend/app/graph/enrich.py
"""
Graph enrichment — CVE data and blast radius.
Called by P3's pipeline runner at Stage 3, after build_graph().

Pass 1: CVE enrichment — nodes with known container_image get
  cvss_live, cve_id, known_exploit from NVD_SNAPSHOT
Pass 2: Blast radius — normalised downstream reachability 0-100
  Used by AI Opinion Model for impact estimation
  Used by Cytoscape.js for node sizing in the UI
"""
import networkx as nx
import logging

logger = logging.getLogger(__name__)


def enrich_graph(G: nx.DiGraph) -> nx.DiGraph:
    """
    Enriches graph in-place with CVE data and blast radius.
    Returns the same graph object (modified).
    """
    # Import NVD_SNAPSHOT from supply chain engine (single source of truth)
    try:
        from app.engines.supply_chain import NVD_SNAPSHOT
    except ImportError:
        import json
        from pathlib import Path
        _nvd = Path(__file__).parent.parent / 'data' / 'nvd_snapshot.json'
        NVD_SNAPSHOT = json.loads(_nvd.read_text()) if _nvd.exists() else {}
        logger.warning('[ENRICH] Loaded NVD from data/ fallback (supply_chain not available)')

    total = G.number_of_nodes()
    if total == 0:
        return G

    # Pass 1: CVE enrichment
    cve_enriched = 0
    for node, attrs in G.nodes(data=True):
        img = attrs.get('container_image')
        if img and img in NVD_SNAPSHOT:
            cves = NVD_SNAPSHOT[img]
            # cves: list of (cve_id, cvss, fix_version) tuples or lists
            best_cvss  = max(entry[1] for entry in cves)
            first_cve  = cves[0][0]
            G.nodes[node].update({
                'cvss_live':     best_cvss,
                'cve_id':        first_cve,
                'known_exploit': True,
            })
            cve_enriched += 1
            logger.debug(f'[ENRICH] {node}: {first_cve} CVSS {best_cvss}')

    # Pass 2: Blast radius (normalised 0-100)
    for node in G.nodes:
        descendants = len(nx.descendants(G, node))
        G.nodes[node]['blast_radius'] = round(
            (descendants / total * 100) if total else 0, 1
        )

    logger.info(f'[ENRICH] {total} nodes | {cve_enriched} CVE-enriched | blast radius computed')
    return G
