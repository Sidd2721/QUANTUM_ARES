import json
import networkx as nx

from parsers import parse_input
from engines import (
    zero_trust_engine,
    quantum_engine,
    attack_path_engine,
    supply_chain_engine,
    enrich_with_compliance
)


def build_graph(data):
    G = nx.DiGraph()

    # Add nodes
    for n in data["nodes"]:
        G.add_node(n["id"], **n)

    # Add edges
    for e in data["edges"]:
        G.add_edge(e["source"], e["target"], **e)

    return G


def main():
    # Load input file
    with open("sample.json", "r") as f:
        raw = f.read()

    # Parse
    parsed = parse_input(raw, "sample.json")

    # Build graph
    G = build_graph(parsed)

    # Run engines
    findings = []

    zt, zt_score = zero_trust_engine(G)
    q, q_score = quantum_engine(G)
    ap, ap_score = attack_path_engine(G)
    sc, sc_score = supply_chain_engine(G)

    findings.extend(zt + q + ap + sc)

    # Compliance enrichment
    findings, comp_score = enrich_with_compliance(findings)

    # Print results
    print("\n=== RESULTS ===")
    for f in findings:
        print(f"\n[{f['rule_id']}] {f['description']}")
        print("Severity:", f["severity"])
        print("Affected:", f["affected_nodes"])

    print("\n=== SCORES ===")
    print("Zero Trust:", zt_score)
    print("Quantum:", q_score)
    print("Attack Path:", ap_score)
    print("Supply Chain:", sc_score)
    print("Compliance:", comp_score)


if __name__ == "__main__":
    main()