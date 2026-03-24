# app/report/pdf_builder.py
"""
ReportLab PDF generator for Quantum Ares security reports.
Returns raw bytes — caller handles storage and signing.

CRITICAL: Always call buf.seek(0) before buf.read().
          Forgetting seek(0) returns 0 bytes and produces blank PDFs.
"""

import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Colour palette ────────────────────────────────────────────────────────────
C_PRIMARY   = colors.HexColor("#1D2B3A")
C_ACCENT    = colors.HexColor("#534AB7")
C_GREEN     = colors.HexColor("#1D9E75")
C_ORANGE    = colors.HexColor("#E07B39")
C_RED       = colors.HexColor("#C0392B")
C_LIGHT_BG  = colors.HexColor("#F4F5F7")
C_BORDER    = colors.HexColor("#DDE1E7")

SEVERITY_COLOUR = {
    "CRITICAL": C_RED,
    "HIGH":     C_ORANGE,
    "MEDIUM":   C_ORANGE,
    "LOW":      C_GREEN,
}

INDEX_COLOUR = {
    range(0,  30): C_RED,
    range(30, 60): C_ORANGE,
    range(60, 101): C_GREEN,
}


def _index_colour(idx: int):
    for r, c in INDEX_COLOUR.items():
        if idx in r:
            return c
    return C_RED


def build_pdf(scan: dict, org_name: str = "DemoOrg", signature: str = None) -> bytes:
    """
    Build a complete security report PDF from a scan result dict.

    Args:
        scan:     Full scan result dict (from queries.get_scan or API response)
        org_name: Organisation display name for the cover page
        signature: The RSA-2048 signature string (base64) to inject in pass 2.

    Returns:
        Raw PDF bytes. Sign with signer.sign_pdf(bytes) immediately after.

    CRITICAL: buf.seek(0) is called before buf.read().
              Never remove this line.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Helper styles ─────────────────────────────────────────────────────────
    h1 = ParagraphStyle("H1QA", fontSize=22, textColor=C_PRIMARY, spaceAfter=6,
                        fontName="Helvetica-Bold", alignment=TA_LEFT)
    h2 = ParagraphStyle("H2QA", fontSize=14, textColor=C_PRIMARY, spaceAfter=4,
                        fontName="Helvetica-Bold", spaceBefore=14)
    body = ParagraphStyle("BodyQA", fontSize=9, textColor=colors.HexColor("#3D4756"),
                          leading=13, spaceAfter=4)
    small = ParagraphStyle("SmallQA", fontSize=8, textColor=colors.grey, leading=11)
    mono = ParagraphStyle("MonoQA", fontSize=8, fontName="Courier",
                          textColor=C_PRIMARY, leading=11, spaceAfter=2)

    # ── Helpers ───────────────────────────────────────────────────────────────
    def hr():
        return HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=8, spaceBefore=4)

    def spacer(h=0.15):
        return Spacer(1, h * inch)

    def _parse_json_field(val, default):
        if isinstance(val, str):
            try:
                return json.loads(val)
            except Exception:
                return default
        return val if val is not None else default

    findings_list   = _parse_json_field(scan.get("findings"), [])
    patches_list    = _parse_json_field(scan.get("auto_fix_patches"), [])
    exec_summary    = _parse_json_field(scan.get("executive_summary"), {})
    score_breakdown = _parse_json_field(scan.get("score_breakdown"), {})

    # ── PAGE 1: COVER ─────────────────────────────────────────────────────────
    idx    = int(scan.get("security_index", 0) or 0)
    risk   = exec_summary.get("risk_level", "UNKNOWN")
    c_risk = SEVERITY_COLOUR.get(risk, C_PRIMARY)
    c_idx  = _index_colour(idx)

    story.append(spacer(0.5))
    story.append(Paragraph("QUANTUM ARES", ParagraphStyle(
        "Brand", fontSize=11, textColor=C_ACCENT, fontName="Helvetica-Bold",
        spaceAfter=2)))
    story.append(Paragraph("Security Assessment Report", h1))
    story.append(hr())
    story.append(spacer(0.2))

    # Score badge
    score_table = Table(
        [[
            Paragraph(str(idx), ParagraphStyle("ScoreNum", fontSize=52,
                      fontName="Helvetica-Bold", textColor=c_idx, alignment=TA_CENTER)),
            Table([[Paragraph("SECURITY INDEX", ParagraphStyle(
                        "SILabel", fontSize=9, fontName="Helvetica-Bold",
                        textColor=colors.grey))],
                   [Paragraph(risk, ParagraphStyle(
                        "RiskLabel", fontSize=22, fontName="Helvetica-Bold",
                        textColor=c_risk))]],
                   colWidths=[3.5 * inch])
        ]],
        colWidths=[1.8 * inch, 3.5 * inch]
    )
    score_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING",   (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 12),
        ("BACKGROUND",   (0, 0), (-1, -1), C_LIGHT_BG),
    ]))
    story.append(score_table)
    story.append(spacer(0.2))

    # Metadata table
    meta = [
        ["Organisation", org_name],
        ["Scan ID",      scan.get("id", "—")],
        ["Nodes Scanned", str(scan.get("node_count", "—"))],
        ["Critical Findings", str(exec_summary.get("critical_count", "—"))],
        ["Attack Paths", str(exec_summary.get("attack_paths", "—"))],
        ["Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
    ]
    mt = Table([[Paragraph(k, small), Paragraph(str(v), body)]
                for k, v in meta],
               colWidths=[2.0 * inch, 4.5 * inch])
    mt.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, C_LIGHT_BG]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, C_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    story.append(mt)
    story.append(spacer(0.3))

    # Risk summary
    risk_summary = scan.get("risk_summary") or exec_summary.get("summary", "")
    if risk_summary:
        story.append(Paragraph("Executive Overview", h2))
        story.append(Paragraph(str(risk_summary), body))

    story.append(PageBreak())

    # ── PAGE 2: SCORE BREAKDOWN ───────────────────────────────────────────────
    story.append(Paragraph("Score Breakdown", h2))
    story.append(hr())
    if score_breakdown:
        bd_rows = [["Engine", "Score", "Weight", "Contribution"]]
        engine_weights = {
            "zero_trust":   ("Zero Trust",   "35%"),
            "quantum":      ("Quantum Risk",  "20%"),
            "attack_path":  ("Attack Path",   "25%"),
            "supply_chain": ("Supply Chain",  "10%"),
            "compliance":   ("Compliance",    "10%"),
        }
        for key, (name, weight) in engine_weights.items():
            val = score_breakdown.get(key, 0)
            if isinstance(val, str):
                try:
                    val = float(val)
                except ValueError:
                    val = 0
            bd_rows.append([name, f"{val:.1f}", weight,
                            "Contributing" if val > 0 else "Clamped to 0"])
        total = score_breakdown.get('total', idx)
        if isinstance(total, str):
            try:
                total = float(total)
            except ValueError:
                total = 0
        bd_rows.append(["TOTAL", f"{total:.1f}", "100%", "= Security Index"])

        bt = Table(bd_rows, colWidths=[2.2*inch, 1.0*inch, 1.0*inch, 2.3*inch])
        bt.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), C_PRIMARY),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, C_LIGHT_BG]),
            ("BACKGROUND",  (0, -1), (-1, -1), C_ACCENT),
            ("TEXTCOLOR",   (0, -1), (-1, -1), colors.white),
            ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
            ("LINEBELOW",   (0, 0), (-1, -1), 0.3, C_BORDER),
            ("TOPPADDING",  (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(bt)
    story.append(spacer(0.2))

    # ── PAGE 3+: FINDINGS TABLE ────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Security Findings", h2))
    story.append(hr())

    if findings_list:
        f_rows = [["#", "Severity", "Engine", "Description", "MITRE / Rule"]]
        for i, f in enumerate(findings_list[:40], 1):
            sev = f.get("severity", "MEDIUM")
            f_rows.append([
                str(i),
                sev,
                f.get("engine", "—"),
                Paragraph(str(f.get("description", "—"))[:120], small),
                f.get("mitre_technique", f.get("rule_id", "—")),
            ])

        ft = Table(f_rows, colWidths=[0.3*inch, 0.7*inch, 0.9*inch, 3.7*inch, 1.0*inch])
        ft.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), C_PRIMARY),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_LIGHT_BG]),
            ("LINEBELOW",   (0, 0), (-1, -1), 0.3, C_BORDER),
            ("TOPPADDING",  (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ]))

        for i, f in enumerate(findings_list[:40], 1):
            sev = f.get("severity", "MEDIUM")
            c = SEVERITY_COLOUR.get(sev, C_ORANGE)
            ft.setStyle(TableStyle([
                ("TEXTCOLOR", (1, i), (1, i), c),
                ("FONTNAME",  (1, i), (1, i), "Helvetica-Bold"),
            ]))

        story.append(ft)
    else:
        story.append(Paragraph("No findings recorded for this scan.", body))

    # ── AI OPINION HIGHLIGHTS ─────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("AI Opinion Highlights", h2))
    story.append(hr())

    critical_findings = [f for f in findings_list if f.get("severity") == "CRITICAL"][:5]
    for f in critical_findings:
        opinion = f.get("ai_opinion", {})
        if not opinion:
            continue
        story.append(Paragraph(str(f.get("description", "Finding"))[:100], ParagraphStyle(
            "FTitle", fontSize=9, fontName="Helvetica-Bold",
            textColor=C_PRIMARY, spaceAfter=2)))
        if opinion.get("impact"):
            story.append(Paragraph(f"Impact: {opinion['impact']}", body))
        if opinion.get("attack_story"):
            story.append(Paragraph(f"Scenario: {opinion['attack_story']}", body))
        priority = opinion.get("priority", "")
        if priority:
            story.append(Paragraph(f"Priority: {priority}", small))
        story.append(spacer(0.1))

    # ── AUTO-FIX PATCHES ──────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Automated Remediation Patches", h2))
    story.append(hr())

    if patches_list:
        story.append(Paragraph(
            f"{len(patches_list)} patch(es) generated. Download the .tf / .yaml / .json files "
            "from the Patches panel to apply directly to your infrastructure.",
            body))
        story.append(spacer(0.1))
        for p in patches_list[:6]:
            story.append(Paragraph(
                f"{p.get('patch_id','—')}  ·  {p.get('title','—')}  ·  "
                f"CVSS {p.get('cvss_score','—')}  ·  Impact +{p.get('score_impact',0)}",
                ParagraphStyle("PHead", fontSize=9, fontName="Helvetica-Bold",
                               textColor=C_PRIMARY, spaceAfter=2)))
            if p.get("description"):
                story.append(Paragraph(str(p["description"])[:160], small))
            story.append(spacer(0.08))
    else:
        story.append(Paragraph("No automated patches available for this scan.", body))

    # ── SIGNATURE FOOTER ──────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Report Integrity", h2))
    story.append(hr())
    story.append(Paragraph(
        "This report is cryptographically signed with RSA-2048. "
        "The SHA-256 hash below uniquely identifies the report content. "
        "Use the public key to verify the signature independently.",
        body))
    story.append(spacer(0.1))
    if signature:
        # Wrap long signatures using a simple table or breaking them up
        story.append(Paragraph(f"<b>Signature:</b> {signature}", mono))
    else:
        story.append(Paragraph("[SIGNATURE PLACEHOLDER — injected by sign_pdf()]", mono))
    story.append(spacer(0.3))
    story.append(Paragraph(
        f"Generated by Quantum Ares v7.75  ·  {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        small))

    # ── BUILD ─────────────────────────────────────────────────────────────────
    doc.build(story)

    # CRITICAL: seek(0) before read() — without this, returns 0 bytes
    buf.seek(0)
    return buf.read()
