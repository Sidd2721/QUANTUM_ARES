# QUANTUM-ARES Architecture & File Structure Report

This report provides a complete, clean overview of the application's source code hierarchy, excluding dependency binaries and cache folders (`node_modules`, `venv`, etc.) to focus explicitly on the product's architecture.

## High-Level Architecture
- **frontend/**: React + Vite SaaS client. Features a custom `Precision Threat Intelligence` design system, Enterprise Login flow, and a 6-tab Security Dashboard driven by Cytoscape and Recharts.
- **backend/**: FastAPI engine powering the analysis. Includes the FTS5 SQLite database, LLM Chat agent, PDF generator, and the 5 critical security engines (Zero-Trust, Quantum Risk, Attack Path, Supply Chain, Compliance).

## Source Code Hierarchy

```text
QUANTUM_ARES/
├── .gitignore
├── COMPLETE_ARCHITECTURAL_REPORT.md
├── COMPONENT_INTEGRATION_GUIDE.md
├── LAUNCH.md
├── QUICK_REFERENCE_GUIDE.md
├── Quantum_Ares P1
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── DATABASE_INTEGRATION_GUIDE.md
│   ├── FILE_DEPENDENCY_MAP.md
│   ├── PROJECT_ARCHITECTURE_REPORT.md
│   ├── README_DOCUMENTATION.md
│   ├── backend
│   │   ├── engines
│   │   │   ├── __init__.py
│   │   │   ├── attack_path.py
│   │   │   ├── compliance.py
│   │   │   ├── quantum.py
│   │   │   ├── rules.py
│   │   │   ├── supply_chain.py
│   │   │   └── zero_trust.py
│   │   ├── parsers
│   │   │   ├── __init__.py
│   │   │   ├── json_parser.py
│   │   │   ├── tf_parser.py
│   │   │   └── yaml_parser.py
│   │   ├── requirements.txt
│   │   ├── run_engines.py
│   │   └── sample.json
│   └── frontend
│       ├── .gitignore
│       ├── README.md
│       ├── eslint.config.js
│       ├── index.html
│       ├── package-lock.json
│       ├── package.json
│       ├── public
│       │   ├── favicon.svg
│       │   └── icons.svg
│       ├── src
│       │   ├── App.css
│       │   ├── App.jsx
│       │   ├── assets
│       │   │   ├── hero.png
│       │   │   ├── react.svg
│       │   │   └── vite.svg
│       │   ├── index.css
│       │   └── main.jsx
│       └── vite.config.js
├── Quantum_Ares P2
│   ├── .gitignore
│   ├── ATTRIBUTIONS.md
│   ├── DATABASE_INTEGRATION.md
│   ├── QUICK_REFERENCE.md
│   ├── README.md
│   ├── TECHNICAL_REPORT.md
│   ├── default_shadcn_theme.css
│   ├── guidelines
│   │   └── Guidelines.md
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── postcss.config.mjs
│   ├── src
│   │   ├── app
│   │   │   ├── App.tsx
│   │   │   ├── AppRoot.tsx
│   │   │   ├── components
│   │   │   │   ├── AIOpinionPanel.tsx
│   │   │   │   ├── AutoFixPanel.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ComplianceRadar.tsx
│   │   │   │   ├── ConfidencePanel.tsx
│   │   │   │   ├── GraphView.tsx
│   │   │   │   ├── LandingHero.tsx
│   │   │   │   ├── LoadingScreen.tsx
│   │   │   │   ├── QuantumPanel.tsx
│   │   │   │   ├── ReportViewer.tsx
│   │   │   │   ├── ScoreDashboard.tsx
│   │   │   │   ├── SupplyChainPanel.tsx
│   │   │   │   ├── UploadZone.tsx
│   │   │   │   ├── ViolationPanel.tsx
│   │   │   │   ├── figma
│   │   │   │   │   └── ImageWithFallback.tsx
│   │   │   │   └── ui
│   │   │   │       ├── accordion.tsx
│   │   │   │       ├── alert-dialog.tsx
│   │   │   │       ├── alert.tsx
│   │   │   │       ├── aspect-ratio.tsx
│   │   │   │       ├── avatar.tsx
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── breadcrumb.tsx
│   │   │   │       ├── button.tsx
│   │   │   │       ├── calendar.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── carousel.tsx
│   │   │   │       ├── chart.tsx
│   │   │   │       ├── checkbox.tsx
│   │   │   │       ├── collapsible.tsx
│   │   │   │       ├── command.tsx
│   │   │   │       ├── context-menu.tsx
│   │   │   │       ├── dialog.tsx
│   │   │   │       ├── drawer.tsx
│   │   │   │       ├── dropdown-menu.tsx
│   │   │   │       ├── form.tsx
│   │   │   │       ├── hover-card.tsx
│   │   │   │       ├── input-otp.tsx
│   │   │   │       ├── input.tsx
│   │   │   │       ├── label.tsx
│   │   │   │       ├── menubar.tsx
│   │   │   │       ├── navigation-menu.tsx
│   │   │   │       ├── pagination.tsx
│   │   │   │       ├── popover.tsx
│   │   │   │       ├── progress.tsx
│   │   │   │       ├── radio-group.tsx
│   │   │   │       ├── resizable.tsx
│   │   │   │       ├── scroll-area.tsx
│   │   │   │       ├── select.tsx
│   │   │   │       ├── separator.tsx
│   │   │   │       ├── sheet.tsx
│   │   │   │       ├── sidebar.tsx
│   │   │   │       ├── skeleton.tsx
│   │   │   │       ├── slider.tsx
│   │   │   │       ├── sonner.tsx
│   │   │   │       ├── switch.tsx
│   │   │   │       ├── table.tsx
│   │   │   │       ├── tabs.tsx
│   │   │   │       ├── textarea.tsx
│   │   │   │       ├── toggle-group.tsx
│   │   │   │       ├── toggle.tsx
│   │   │   │       ├── tooltip.tsx
│   │   │   │       ├── use-mobile.ts
│   │   │   │       └── utils.ts
│   │   │   ├── layouts
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── pages
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   └── dashboard
│   │   │   │       ├── AIOpinionPage.tsx
│   │   │   │       ├── AutoFixPage.tsx
│   │   │   │       ├── ChatPage.tsx
│   │   │   │       ├── CompliancePage.tsx
│   │   │   │       ├── ConfidencePage.tsx
│   │   │   │       ├── GraphPage.tsx
│   │   │   │       ├── QuantumPage.tsx
│   │   │   │       ├── ReportPage.tsx
│   │   │   │       ├── ScorePage.tsx
│   │   │   │       ├── SupplyChainPage.tsx
│   │   │   │       └── ViolationsPage.tsx
│   │   │   └── routes.tsx
│   │   ├── main.tsx
│   │   └── styles
│   │       ├── fonts.css
│   │       ├── index.css
│   │       ├── tailwind.css
│   │       └── theme.css
│   └── vite.config.ts
├── README.md
├── RENDER_DEPLOY_INSTRUCTIONS.md
├── ares-guardian-report.md
├── backend
│   ├── Dockerfile
│   ├── E2E_Test.ps1
│   ├── Gate5_Test.ps1
│   ├── __init__.py
│   ├── app
│   │   ├── __init__.py
│   │   ├── advisory
│   │   │   ├── __init__.py
│   │   │   ├── tier1.py
│   │   │   └── tier2.py
│   │   ├── ai
│   │   │   ├── __init__.py
│   │   │   ├── opinion.py
│   │   │   └── summarizer.py
│   │   ├── api
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── endpoints.py
│   │   │   └── schemas.py
│   │   ├── autofix
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── templates.json
│   │   ├── confidence
│   │   │   ├── __init__.py
│   │   │   └── model.py
│   │   ├── config.py
│   │   ├── data
│   │   │   ├── ai_templates.json
│   │   │   ├── dpdp_act_2023.txt
│   │   │   ├── nist_sp_800_207.txt
│   │   │   ├── nvd_snapshot.json
│   │   │   ├── quantum_ares.db
│   │   │   ├── quantum_ares.db-shm
│   │   │   ├── quantum_ares.db-wal
│   │   │   └── rbi_master_direction.txt
│   │   ├── db
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   ├── repository.py
│   │   │   └── schema.sql
│   │   ├── engines
│   │   │   ├── __init__.py
│   │   │   ├── attack_path.py
│   │   │   ├── compliance.py
│   │   │   ├── quantum.py
│   │   │   ├── rules.py
│   │   │   ├── supply_chain.py
│   │   │   └── zero_trust.py
│   │   ├── graph
│   │   │   ├── __init__.py
│   │   │   ├── builder.py
│   │   │   ├── enrich.py
│   │   │   └── serializer.py
│   │   ├── main.py
│   │   ├── parsers
│   │   │   ├── __init__.py
│   │   │   ├── json_parser.py
│   │   │   ├── terraform_parser.py
│   │   │   └── yaml_parser.py
│   │   ├── pipeline
│   │   │   ├── __init__.py
│   │   │   ├── runner.py
│   │   │   └── scoring.py
│   │   ├── report
│   │   │   ├── __init__.py
│   │   │   ├── blockchain.py
│   │   │   ├── pdf_builder.py
│   │   │   └── signer.py
│   │   └── scripts
│   │       ├── __init__.py
│   │       ├── app
│   │       │   └── data
│   │       │       └── quantum_ares.db
│   │       └── seed.py
│   ├── cors_check.py
│   ├── data
│   │   └── quantum_ares.db
│   ├── day6_auto.py
│   ├── debug_zt001.py
│   ├── dep_check.py
│   ├── final_diag.py
│   ├── pytest.ini
│   ├── pytest_output.txt
│   ├── quality_scan.py
│   ├── quick_check.py
│   ├── requirements.txt
│   ├── seed.py
│   ├── test_api_debug.txt
│   ├── test_api_debug2.txt
│   ├── test_day4_r2.txt
│   ├── test_day4_r3.txt
│   ├── test_day4_r4.txt
│   ├── test_day4_r5.txt
│   ├── test_day4_r6.txt
│   ├── test_day4_results.txt
│   ├── test_httpx.py
│   ├── test_script.py
│   ├── tests
│   │   ├── __init__.py
│   │   ├── fixtures.py
│   │   ├── test_ai_opinion.py
│   │   ├── test_api.py
│   │   ├── test_autofix.py
│   │   ├── test_confidence.py
│   │   ├── test_db.py
│   │   ├── test_engines.py
│   │   ├── test_final_contract.py
│   │   ├── test_pipeline.py
│   │   ├── test_report.py
│   │   ├── test_routes_day4.py
│   │   └── test_routes_day5.py
│   ├── verify_p1_advisory.py
│   ├── verify_p1_ai.py
│   ├── verify_p1_engines.py
│   ├── verify_p1_parsers.py
│   ├── verify_p2_graph.py
│   └── verify_quantum_wiring.py
├── demo
│   ├── bank.json
│   ├── government.json
│   └── hospital.json
├── docker-compose.yml
├── frontend
│   ├── .env.local
│   ├── .gitignore
│   ├── ATTRIBUTIONS.md
│   ├── DATABASE_INTEGRATION.md
│   ├── DESIGN.md
│   ├── Dockerfile
│   ├── QUICK_REFERENCE.md
│   ├── README.md
│   ├── TECHNICAL_REPORT.md
│   ├── default_shadcn_theme.css
│   ├── guidelines
│   │   └── Guidelines.md
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── postcss.config.mjs
│   ├── public
│   │   └── demo
│   │       ├── bank.json
│   │       ├── government.json
│   │       └── hospital.json
│   ├── src
│   │   ├── app
│   │   │   ├── App.tsx
│   │   │   ├── AppShell.tsx
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── components
│   │   │   │   └── LandingHero.tsx
│   │   │   ├── pages
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   └── dashboard
│   │   │   │       ├── AIOpinionPage.tsx
│   │   │   │       ├── AutoFixPage.tsx
│   │   │   │       ├── ChatPage.tsx
│   │   │   │       ├── CompliancePage.tsx
│   │   │   │       ├── ConfidencePage.tsx
│   │   │   │       ├── GraphPage.tsx
│   │   │   │       ├── QuantumPage.tsx
│   │   │   │       ├── ReportPage.tsx
│   │   │   │       ├── ScorePage.tsx
│   │   │   │       ├── SupplyChainPage.tsx
│   │   │   │       └── ViolationsPage.tsx
│   │   │   └── router.tsx
│   │   ├── components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── panels
│   │   │   │   ├── AIOpinionPanel.tsx
│   │   │   │   ├── AutoFixPanel.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── ComplianceRadar.tsx
│   │   │   │   ├── ConfidencePanel.tsx
│   │   │   │   ├── GraphPanel.tsx
│   │   │   │   ├── GraphView.tsx
│   │   │   │   ├── QuantumPanel.tsx
│   │   │   │   ├── QuantumRiskPanel.tsx
│   │   │   │   ├── ReportPanel.tsx
│   │   │   │   ├── ReportViewer.tsx
│   │   │   │   ├── ScoreDashboard.tsx
│   │   │   │   ├── ScorePanel.tsx
│   │   │   │   ├── SupplyChainPanel.tsx
│   │   │   │   ├── ViolationPanel.tsx
│   │   │   │   ├── ViolationsPanel.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui
│   │   │       ├── CodeBlock.tsx
│   │   │       ├── ScoreRing.tsx
│   │   │       └── SeverityBadge.tsx
│   │   ├── features
│   │   │   ├── auth
│   │   │   ├── report
│   │   │   └── scan
│   │   │       ├── DashboardShell.tsx
│   │   │       ├── LoadingScreen.tsx
│   │   │       ├── ScanDashboard.tsx
│   │   │       ├── UploadZone.tsx
│   │   │       └── tabs
│   │   │           ├── QuantumComplianceTab.tsx
│   │   │           ├── RemediationTab.tsx
│   │   │           ├── ReportsAdvisoryTab.tsx
│   │   │           ├── RiskOverviewTab.tsx
│   │   │           └── ThreatMapTab.tsx
│   │   ├── hooks
│   │   │   ├── index.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useScan.ts
│   │   ├── lib
│   │   │   └── api.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── dashboard
│   │   │       ├── HistoryPage.tsx
│   │   │       ├── OverviewPage.tsx
│   │   │       ├── ReportsPage.tsx
│   │   │       ├── ScanResultPage.tsx
│   │   │       └── UploadPage.tsx
│   │   ├── services
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── index.ts
│   │   │   ├── report.service.ts
│   │   │   └── scan.service.ts
│   │   ├── styles
│   │   │   ├── fonts.css
│   │   │   ├── index.css
│   │   │   ├── tailwind.css
│   │   │   └── theme.css
│   │   └── types
│   │       ├── api.types.ts
│   │       └── index.ts
│   └── vite.config.ts
├── generate_report.mjs
├── generate_report.py
├── import_check.py
├── stubs_backup
│   ├── advisory_pre_p1
│   │   ├── __init__.py
│   │   ├── tier1.py
│   │   └── tier2.py
│   ├── ai_pre_p1
│   │   ├── __init__.py
│   │   ├── opinion.py
│   │   └── summarizer.py
│   ├── engines_pre_p1
│   │   ├── __init__.py
│   │   ├── attack_path.py
│   │   ├── compliance.py
│   │   ├── quantum.py
│   │   ├── rules.py
│   │   ├── supply_chain.py
│   │   └── zero_trust.py
│   ├── graph_pre_p2
│   │   ├── __init__.py
│   │   ├── builder.py
│   │   ├── enrich.py
│   │   └── serializer.py
│   └── parsers_pre_p1
│       ├── __init__.py
│       ├── json_parser.py
│       ├── tf_parser.py
│       └── yaml_parser.py
├── tests
│   ├── __init__.py
│   ├── fixtures.py
│   ├── test_ai_opinion.py
│   ├── test_api.py
│   ├── test_autofix.py
│   ├── test_confidence.py
│   ├── test_db.py
│   ├── test_endpoints.py
│   ├── test_engines.py
│   ├── test_pipeline.py
│   ├── test_report.py
│   └── test_routes_day5.py
├── token.json
└── tree_output.txt

```

## Major Components Map
- **Landing Page**: `frontend/src/pages/LandingPage.tsx`
- **Dashboard Shell**: `frontend/src/app/DashboardShell.tsx`
- **Scan Engine Manager**: `backend/app/engines/manager.py`
- **Security Index Generation**: `backend/app/core/scoring.yaml` derived through `score_panel.tsx`
- **Chat AI Engine**: `backend/app/services/chat_agent.py` & `frontend/src/components/panels/ChatPanel.tsx`
