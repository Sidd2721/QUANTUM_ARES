# parsers/__init__.py

from .json_parser import parse_json, ParseError
from .yaml_parser import parse_yaml
from .tf_parser import parse_terraform


def parse_input(raw_text: str, filename: str = "") -> dict:
    """
    Auto-detect input format and route to correct parser.
    """

    fn = filename.lower()

    if fn.endswith(".tf") or fn.endswith(".hcl"):
        return parse_terraform(raw_text)

    if fn.endswith(".yaml") or fn.endswith(".yml"):
        return parse_yaml(raw_text)

    # Default: try JSON first
    try:
        return parse_json(raw_text)
    except ParseError:
        # fallback to YAML
        return parse_yaml(raw_text)