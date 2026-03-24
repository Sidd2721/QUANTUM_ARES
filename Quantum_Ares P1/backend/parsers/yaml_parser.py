# parsers/yaml_parser.py

import yaml
import json
from .json_parser import parse_json, ParseError


def parse_yaml(raw_text: str) -> dict:
    """
    Parses YAML and converts into standard node/edge format.
    """

    try:
        data = yaml.safe_load(raw_text)
    except yaml.YAMLError as e:
        raise ParseError(f"Invalid YAML: {e}")

    # If already in expected format
    if isinstance(data, dict) and "nodes" in data:
        return parse_json(json.dumps(data))

    nodes = []
    edges = []

    items = data.get("items", [data])

    for i, item in enumerate(items):
        kind = item.get("kind", "unknown")
        metadata = item.get("metadata", {})
        spec = item.get("spec", {})

        name = metadata.get("name", f"resource_{i}")
        namespace = metadata.get("namespace", "default")

        containers = (
            spec.get("template", {})
            .get("spec", {})
            .get("containers", [])
        )

        image = containers[0].get("image") if containers else None

        nodes.append({
            "id": name,
            "name": name,
            "type": kind.lower(),
            "zone": "INTERNAL",
            "data_sensitivity": "LOW",
            "encryption_type": "unknown",
            "container_image": image,
            "retention_years": 0,
            "iam_roles": []
        })

    if not nodes:
        raise ParseError("No valid resources found in YAML")

    return {
        "nodes": nodes,
        "edges": edges,
        "evidence_source": "yaml"
    }