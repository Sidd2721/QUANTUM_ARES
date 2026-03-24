# backend/app/api/schemas.py
"""
Pydantic v2 request validation models for QUANTUM-ARES.

ScanRequest  → the top-level upload structure
NodeInput    → one infrastructure node
EdgeInput    → one connection between nodes

Validation rules:
  - Node IDs: alphanumeric + underscore + hyphen only
  - Zones: whitelisted values only
  - Sensitivity: whitelisted values only
  - Edges: source and target must exist in node IDs
  - No self-loops: source != target on every edge
  - Max 200 nodes per scan (Community tier cap)
"""

from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional
import re

ALLOWED_ZONES = {'PUBLIC', 'DMZ', 'INTERNAL', 'PRIVATE', 'RESTRICTED'}
ALLOWED_SENSITIVITY = {'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'}
ALLOWED_ENCRYPTION = {
    'AES-256', 'AES-128', 'RSA-2048', 'RSA-4096', 'RSA-1024',
    'ECC-256', 'ECC-384', 'ML-KEM-768', 'Kyber-768',
    'DH-1024', 'DH-2048', 'none', 'unknown'
}
ALLOWED_ACCESS_SCOPE = {'FULL', 'SCOPED', 'READ_ONLY'}
ALLOWED_EVIDENCE = {'manual', 'json', 'yaml', 'terraform', 'aws_config', 'k8s', 'nmap'}

NODE_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_\-]{1,64}$')


class NodeInput(BaseModel):
    id: str
    name: Optional[str] = None
    type: Optional[str] = 'unknown'
    zone: Optional[str] = 'INTERNAL'
    data_sensitivity: Optional[str] = 'LOW'
    encryption_type: Optional[str] = 'unknown'
    container_image: Optional[str] = None
    iam_roles: Optional[List[str]] = []
    retention_years: Optional[int] = 0
    known_exploit: Optional[bool] = False

    @field_validator('id')
    @classmethod
    def validate_id(cls, v):
        if not NODE_ID_PATTERN.match(v):
            raise ValueError(f'Node id "{v}" contains invalid characters.')
        return v

    @field_validator('zone')
    @classmethod
    def validate_zone(cls, v):
        if v and v not in ALLOWED_ZONES:
            raise ValueError(f'Invalid zone "{v}". Must be one of: {sorted(ALLOWED_ZONES)}')
        return v

    @field_validator('data_sensitivity')
    @classmethod
    def validate_sensitivity(cls, v):
        if v and v not in ALLOWED_SENSITIVITY:
            raise ValueError(f'Invalid data_sensitivity "{v}".')
        return v

    @field_validator('retention_years')
    @classmethod
    def validate_retention(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('retention_years must be between 0 and 100')
        return v


class EdgeInput(BaseModel):
    source: str
    target: str
    auth_required: Optional[bool] = False
    mfa_required: Optional[bool] = False
    tls_enforced: Optional[bool] = False
    access_scope: Optional[str] = 'SCOPED'
    protocol: Optional[str] = 'unknown'
    trust_level: Optional[str] = 'LOW'
    per_session_auth: Optional[bool] = False
    explicit_auth: Optional[bool] = False
    least_privilege: Optional[bool] = False

    @field_validator('source', 'target')
    @classmethod
    def validate_endpoint_id(cls, v):
        if not NODE_ID_PATTERN.match(v):
            raise ValueError(f'Edge endpoint "{v}" contains invalid characters.')
        return v

    @field_validator('access_scope')
    @classmethod
    def validate_scope(cls, v):
        if v and v not in ALLOWED_ACCESS_SCOPE:
            raise ValueError(f'Invalid access_scope "{v}".')
        return v


class ScanRequest(BaseModel):
    nodes: List[NodeInput]
    edges: List[EdgeInput] = []
    evidence_source: Optional[str] = 'json'

    @field_validator('nodes')
    @classmethod
    def validate_node_count(cls, v):
        if len(v) == 0:
            raise ValueError('At least one node is required')
        if len(v) > 200:
            raise ValueError(f'Graph exceeds 200-node limit (got {len(v)}).')
        ids = [n.id for n in v]
        if len(ids) != len(set(ids)):
            dupes = [x for x in ids if ids.count(x) > 1]
            raise ValueError(f'Duplicate node IDs detected: {list(set(dupes))}')
        return v

    @field_validator('evidence_source')
    @classmethod
    def validate_evidence(cls, v):
        if v and v not in ALLOWED_EVIDENCE:
            raise ValueError(f'Invalid evidence_source "{v}".')
        return v

    @model_validator(mode='after')
    def validate_edges(self):
        node_ids = {n.id for n in self.nodes}
        for edge in self.edges:
            if edge.source == edge.target:
                raise ValueError(f'Self-loop detected on node "{edge.source}".')
            if edge.source not in node_ids:
                raise ValueError(f'Edge source "{edge.source}" not found in nodes list.')
            if edge.target not in node_ids:
                raise ValueError(f'Edge target "{edge.target}" not found in nodes list.')
        return self

    def to_dict(self) -> dict:
        return {
            'nodes': [n.model_dump() for n in self.nodes],
            'edges': [e.model_dump() for e in self.edges],
            'evidence_source': self.evidence_source
        }
