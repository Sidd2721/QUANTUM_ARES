# backend/app/confidence/model.py
"""
ConfidenceResolver — the trust model for QUANTUM-ARES.

Assigns a confidence score to the input data based on evidence source.
For low-confidence sources (confidence < 0.70), all positive security
claims on edges are flipped to False before analysis begins.

Demo moment (2:50): "You typed mfa_required: true. We don't trust that.
Evidence source: manual, confidence 0.30. We automatically set those
claims to False and found your vulnerabilities anyway."
"""

from dataclasses import dataclass, field
from typing import List, Dict
import copy
import logging

logger = logging.getLogger(__name__)

EVIDENCE_CONFIDENCE: Dict[str, float] = {
    'terraform':  0.95,
    'aws_config': 0.90,
    'k8s':        0.85,
    'nmap':       0.80,
    'json':       0.60,
    'yaml':       0.60,
    'manual':     0.30,
    'none':       0.10,
}

SECURITY_POSITIVE_CLAIMS: List[str] = [
    'auth_required',
    'mfa_required',
    'tls_enforced',
    'per_session_auth',
    'explicit_auth',
    'least_privilege',
]

EVIDENCE_LABELS: Dict[str, str] = {
    'terraform':  'Terraform IaC (machine-generated)',
    'aws_config': 'AWS Config (API-verified)',
    'k8s':        'Kubernetes manifest',
    'nmap':       'Nmap network scan',
    'json':       'JSON blueprint (user-written)',
    'yaml':       'YAML blueprint (user-written)',
    'manual':     'Manual JSON entry (self-reported)',
    'none':       'No evidence provided',
}


@dataclass
class ConfidenceResolver:
    evidence_source: str
    warnings: List[dict] = field(default_factory=list)

    @property
    def confidence(self) -> float:
        return EVIDENCE_CONFIDENCE.get(self.evidence_source, 0.10)

    @property
    def label(self) -> str:
        return EVIDENCE_LABELS.get(self.evidence_source, self.evidence_source)

    @property
    def is_trusted(self) -> bool:
        return self.confidence >= 0.70

    def resolve(self, raw_data: dict) -> dict:
        resolved = copy.deepcopy(raw_data)
        self.warnings = []

        if self.is_trusted:
            logger.info(
                f'[CONFIDENCE] Source: {self.evidence_source} | '
                f'Score: {self.confidence} | Status: TRUSTED'
            )
            return resolved

        logger.warning(
            f'[CONFIDENCE] Source: {self.evidence_source} | '
            f'Score: {self.confidence} | Status: UNTRUSTED — flipping positive claims'
        )

        for edge in resolved.get('edges', []):
            downgraded = []
            for claim in SECURITY_POSITIVE_CLAIMS:
                if edge.get(claim) is True:
                    edge[claim] = False
                    downgraded.append(claim)

            if downgraded:
                warning = {
                    'edge':              f"{edge.get('source', '?')}→{edge.get('target', '?')}",
                    'downgraded_claims': downgraded,
                    'reason':            (
                        f'Evidence source "{self.evidence_source}" has confidence '
                        f'{self.confidence:.2f} which is below the 0.70 trust threshold.'
                    ),
                    'implication':       (
                        'This edge is analysed as if ALL security controls are absent. '
                        'Claims like mfa_required=true are treated as unverified assertions.'
                    ),
                    'evidence_source':   self.evidence_source,
                    'confidence':        self.confidence,
                }
                self.warnings.append(warning)

        logger.info(
            f'[CONFIDENCE] {len(self.warnings)} edges downgraded across '
            f'{len(resolved.get("edges", []))} total edges'
        )
        return resolved

    def summary(self) -> dict:
        return {
            'evidence_source': self.evidence_source,
            'evidence_label':  self.label,
            'confidence':      self.confidence,
            'trusted':         self.is_trusted,
            'edges_downgraded': len(self.warnings),
            'total_warnings':  len(self.warnings),
        }
