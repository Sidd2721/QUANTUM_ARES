# parsers/tf_parser.py

import json
import re
import logging
from .json_parser import ParseError

logger = logging.getLogger(__name__)


def parse_terraform(raw_text: str) -> dict:
    """
    Terraform parser with 3 fallback strategies
    """

    # -------- Tier 1: python-hcl2 --------
    try:
        import hcl2
        import io

        data = hcl2.load(io.StringIO(raw_text))
        return tf_dict_to_nodes(data, "terraform")

    except Exception as e:
        logger.warning(f"HCL2 parsing failed: {e}")

    # -------- Tier 2: Regex fallback --------
    try:
        return regex_parse(raw_text)

    except Exception as e:
        logger.warning(f"Regex parsing failed: {e}")

    # -------- Tier 3: Fail --------
    raise ParseError(
        "Terraform parsing failed. Convert to JSON using: terraform show -json"
    )


def tf_dict_to_nodes(data: dict, source: str) -> dict:
    nodes = []
    edges = []

    resources = data.get("resource", {})

    for rtype, instances in resources.items():
        for name, config in instances.items():

            if isinstance(config, list):
                config = config[0]

            image = config.get("image") or config.get("container_image")
            encryption = "AES-256" if config.get("storage_encrypted") else "unknown"

            nodes.append({
                "id": name,
                "name": name,
                "type": rtype,
                "zone": "PRIVATE",
                "data_sensitivity": "LOW",
                "encryption_type": encryption,
                "container_image": image,
                "retention_years": 0,
                "iam_roles": []
            })

    if not nodes:
        raise ParseError("No resources found in Terraform")

    return {
        "nodes": nodes,
        "edges": edges,
        "evidence_source": source
    }


def regex_parse(raw_text: str) -> dict:
    """
    Fallback parser using regex
    """

    pattern = r'resource\s+"(\w+)"\s+"(\w+)"'
    matches = re.findall(pattern, raw_text)

    nodes = []

    for rtype, name in matches:
        nodes.append({
            "id": name,
            "name": name,
            "type": rtype,
            "zone": "PRIVATE",
            "data_sensitivity": "LOW",
            "encryption_type": "unknown",
            "container_image": None,
            "retention_years": 0,
            "iam_roles": []
        })

    if not nodes:
        raise ValueError("No Terraform resources detected")

    return {
        "nodes": nodes,
        "edges": [],
        "evidence_source": "terraform"
    }