import fs from 'fs';
import path from 'path';

function generateTree(dirPath, prefix = "") {
    const excludeDirs = new Set(['.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', '.pytest_cache', '.gemini']);
    let entries;
    try {
        entries = fs.readdirSync(dirPath).filter(e => !excludeDirs.has(e)).sort();
    } catch(e) {
        return "";
    }
    
    let treeStr = "";
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const fullPath = path.join(dirPath, entry);
        const isLast = (i === entries.length - 1);
        const connector = isLast ? "└── " : "├── ";
        
        treeStr += `${prefix}${connector}${entry}\n`;
        
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                const extension = isLast ? "    " : "│   ";
                treeStr += generateTree(fullPath, prefix + extension);
            }
        } catch(e) {}
    }
    return treeStr;
}

const rootDir = ".";
const treeOutput = "QUANTUM_ARES/\n" + generateTree(rootDir);

const report = `# QUANTUM-ARES Architecture & File Structure Report

This report provides a complete, clean overview of the application's source code hierarchy, excluding dependency binaries and cache folders (\`node_modules\`, \`venv\`, etc.) to focus explicitly on the product's architecture.

## High-Level Architecture
- **frontend/**: React + Vite SaaS client. Features a custom \`Precision Threat Intelligence\` design system, Enterprise Login flow, and a 6-tab Security Dashboard driven by Cytoscape and Recharts.
- **backend/**: FastAPI engine powering the analysis. Includes the FTS5 SQLite database, LLM Chat agent, PDF generator, and the 5 critical security engines (Zero-Trust, Quantum Risk, Attack Path, Supply Chain, Compliance).

## Source Code Hierarchy

\`\`\`text
${treeOutput}
\`\`\`

## Major Components Map
- **Landing Page**: \`frontend/src/pages/LandingPage.tsx\`
- **Dashboard Shell**: \`frontend/src/app/DashboardShell.tsx\`
- **Scan Engine Manager**: \`backend/app/engines/manager.py\`
- **Security Index Generation**: \`backend/app/core/scoring.yaml\` derived through \`score_panel.tsx\`
- **Chat AI Engine**: \`backend/app/services/chat_agent.py\` & \`frontend/src/components/panels/ChatPanel.tsx\`
`;

fs.writeFileSync("C:/Users/avadu/.gemini/antigravity/brain/aa0ecbb3-e4a4-4184-977c-9f345c3d2e1a/project_structure_report.md", report, 'utf-8');
console.log("Report generated successfully.");
