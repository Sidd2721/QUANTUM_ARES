# QUANTUM-ARES: Comprehensive Technical Report
**Generated:** March 22, 2026  
**Project Type:** Security Assessment & Vulnerability Management System  
**Framework:** React 18.3.1 + TypeScript + Vite 6.3.5 + Tailwind CSS 4.1.12

---

## TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [File Structure & Component Breakdown](#file-structure--component-breakdown)
4. [Routing & Navigation Pipeline](#routing--navigation-pipeline)
5. [Configuration & Build Setup](#configuration--build-setup)
6. [Component Data Flow](#component-data-flow)
7. [Database Integration Points](#database-integration-points)
8. [API/Backend Pipeline Requirements](#apibackend-pipeline-requirements)
9. [State Management Architecture](#state-management-architecture)
10. [User Journey & Workflows](#user-journey--workflows)
11. [External Dependencies & Libraries](#external-dependencies--libraries)
12. [Integration Checklist for Database Connection](#integration-checklist-for-database-connection)

---

## PROJECT OVERVIEW

### Purpose
**Quantum-ARES** is a comprehensive cloud security assessment and vulnerability management platform that:
- Analyzes infrastructure security posture
- Identifies critical vulnerabilities and violations
- Provides AI-powered security insights and remediation recommendations
- Generates compliance reports across multiple frameworks (SOC 2, GDPR, PCI-DSS, HIPAA, ISO 27001, NIST)
- Offers automated remediation capabilities
- Tracks supply chain security risks

### Key Metrics
- **Name:** @figma/my-make-file
- **Version:** 0.0.1  
- **Type:** Module (ES6)
- **Node Version:** Current (Node.js 18+)
- **Package Manager:** pnpm (monorepo workspace)

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| React Router | 7.13.0 | Client-side routing |
| TypeScript | Latest | Type safety |
| Vite | 6.3.5 | Build tool & dev server |
| Tailwind CSS | 4.1.12 | Styling framework |
| Motion (Framer Motion) | 12.23.24 | Animations |
| Recharts | 2.15.2 | Data visualization |
| Radix UI | Latest | Accessible UI components |
| React Hook Form | 7.55.0 | Form management |
| Material-UI Icons | 7.3.5 | Icon library |

---

## ARCHITECTURE OVERVIEW

### High-Level System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    QUANTUM-ARES FRONTEND                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Application (App.tsx)               │   │
│  │      RouterProvider + React Router v7            │   │
│  └──────────────────────────────────────────────────┘   │
│                           │                              │
│     ┌─────────────────────┼─────────────────────┐       │
│     ▼                     ▼                     ▼       │
│  ┌──────────┐         ┌──────────┐         ┌─────────┐ │
│  │ AppRoot  │         │Landing   │         │Dashboard│ │
│  │(Layout)  │         │Page      │         │Layout   │ │
│  └──────────┘         └──────────┘         └─────────┘ │
│                                               │         │
│       ┌─────────────────────────────────────┼────────┐ │
│       ▼                                       ▼        ▼ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │Graph Page   │  │Score Page   │  │Violations   │  ...│
│  │  Component  │  │  Component  │  │Page/Component   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
         │
         │ (Future: HTTP Requests)
         ▼
  [ Backend API Server ]
       ├─ Security Analysis Engine
       ├─ Vulnerability Database
       ├─ User Authentication Service
       └─ Report Generation Service
         │
         ▼
   [ Primary Database ]
   ├─ Violations & Issues
   ├─ Compliance Scores
   ├─ User Sessions
   └─ Historical Data
```

### Design Pattern: Container/Presentational Components
- **Container Components:** Pages in `/pages/dashboard/` manage state and logic
- **Presentational Components:** Components in `/components/` receive props and render UI
- **Layout Components:** `/layouts/` wrap page structure with navigation

---

## FILE STRUCTURE & COMPONENT BREAKDOWN

### Root Configuration Files

#### 📄 `package.json` (Lines 1-100)
**Purpose:** Project dependencies and build scripts

**Key Content:**
```json
{
  "name": "@figma/my-make-file",
  "scripts": {
    "build": "vite build",      // Production build
    "dev": "vite"                // Development server
  }
}
```

**Tasks:**
- Defines 50+ dependencies including React, Radix UI, and visualization libraries
- Configures development and production build systems
- Manages peer dependencies (React, React-DOM marked as optional)

**Database Integration:** Add API client libraries here (axios, react-query, SWR)

---

#### 📄 `vite.config.ts` (Lines 1-25)
**Purpose:** Vite build configuration and asset handling

**Key Content:**
```typescript
- Loads React and Tailwind CSS plugins
- Path alias: @ → ./src
- Asset includes: SVG and CSV files
```

**Tasks:**
- Configures hot module reloading (HMR)
- Sets up module resolution
- Handles static asset imports

**Configuration Notes:**
- React plugin required for JSX
- Tailwind plugin required for CSS compilation
- Path alias enables clean imports: `import from '@/components'`

---

#### 📄 `postcss.config.mjs` (Lines 1-20)
**Purpose:** PostCSS pipeline configuration

**Current Status:** Empty (Tailwind v4 handles everything automatically)

**Note:** Ready for additional PostCSS plugins if needed

---

#### 📄 `pnpm-workspace.yaml` (Lines 1-3)
**Purpose:** pnpm monorepo configuration

**Content:**
```yaml
packages:
  - '.'
```

**Task:** Declares single-package monorepo structure

---

#### 🎨 `index.html` (Lines 1-15)
**Purpose:** HTML entry point

**Structure:**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quantum Ares</title>
  </head>
  <body>
    <div id="root"></div>  <!-- React mounts here -->
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Task:** Bootstrap the React application

---

### Application Entry Point

#### 📄 `src/main.tsx` (Lines 1-8)
**Purpose:** React application initialization

**Code Flow:**
```typescript
1. createRoot() - Creates React 18 root
2. render() - Mounts App component into #root
3. Loads global styles: ./styles/index.css
```

**Dependencies Loaded:**
- React DOM
- Main App component
- Global stylesheet

---

#### 🎨 `src/styles/index.css` (Lines 1-4)
**Purpose:** Global style orchestrator

**Imports Chain:**
```css
fonts.css      → Custom font definitions (Figma design system)
tailwind.css   → Tailwind CSS utilities
theme.css      → Custom theme variables and overrides
```

**Task:** Centralizes all global CSS and design system

---

### Core Application Structure

#### 📄 `src/app/App.tsx` (Lines 1-10)
**Purpose:** Main application wrapper

**Responsibility:**
```typescript
export default function App() {
  return <RouterProvider router={router} />;
}
```

**Tasks:**
1. Enables React Router v7 as the routing engine
2. Passes router configuration to React Router
3. Renders entire app structure

**Integration Point:** This is where API client context could be added

---

#### 📄 `src/app/routes.tsx` (Lines 1-55)
**Purpose:** Central routing configuration

**Route Hierarchy:**
```
/                          ← AppRoot (layout wrapper)
├─ /                       ← LandingPage (index)
│  ├─ Landing Hero UI
│  └─ Loading Animation
│
└─ /dashboard              ← DashboardLayout (main container)
   ├─ /dashboard/          → Redirect to /dashboard/graph
   ├─ /dashboard/graph     ← GraphPage (Network visualization)
   ├─ /dashboard/score     ← ScorePage (Security score dashboard)
   ├─ /dashboard/violations ← ViolationsPage (Active violations list)
   ├─ /dashboard/ai-opinion ← AIOpinionPage (AI insights)
   ├─ /dashboard/auto-fix  ← AutoFixPage (Remediation panel)
   ├─ /dashboard/confidence ← ConfidencePage (Confidence scoring)
   ├─ /dashboard/quantum   ← QuantumPage (Analytics timeline)
   ├─ /dashboard/supply-chain ← SupplyChainPage (CVE tracking)
   ├─ /dashboard/chat      ← ChatPage (AI chat interface)
   ├─ /dashboard/compliance ← CompliancePage (Compliance radar)
   └─ /dashboard/report    ← ReportPage (Executive report)
```

**Router Type:** `createBrowserRouter` - Hash-based routing

**Tasks:**
1. Defines all application routes
2. Loads page components dynamically
3. Establishes layout hierarchy

**Database Integration:** Add API calls before route navigation (e.g., fetch user data)

---

#### 📄 `src/app/AppRoot.tsx` (Lines 1-12)
**Purpose:** Root layout wrapper

**Responsibility:**
```typescript
<div className="min-h-screen text-gray-900" style={{ background: "#F8FAFC" }}>
  <Outlet />  <!-- Renders child routes -->
</div>
```

**Tasks:**
1. Sets minimum height and background color
2. Provides outlet for child routes
3. Establishes base layout

**Styling:** Uses inline Tailwind CSS + custom background color

---

### Layout Components

#### 📄 `src/app/layouts/DashboardLayout.tsx` (Lines 1-151)
**Purpose:** Dashboard main layout with sidebar navigation

**Component Structure:**
```tsx
<div className="flex h-screen">
  <aside> ← Sidebar (w-72)
    ├─ Logo & Title
    ├─ Navigation Links (11 items)
    ├─ Upload Zone
    ├─ User Actions
    └─ Logout Button
  </aside>
  
  <main> ← Main content area
    <Outlet /> ← Renders dashboard page content
  </main>
</div>
```

**State Management:**
```typescript
const [securityScore, setSecurityScore] = useState(42)
const [fixedViolations, setFixedViolations] = useState<string[]>([])
const [isUploading, setIsUploading] = useState(false)
const [loadingStep, setLoadingStep] = useState(0)
```

**Navigation Links (11 items):**
| Icon | Label | Route | Purpose |
|------|-------|-------|---------|
| Activity | Network Graph | /dashboard/graph | Infrastructure visualization |
| Shield | Security Score | /dashboard/score | Overall security rating |
| AlertTriangle | Violations | /dashboard/violations | Issue tracking |
| Brain | AI Insights | /dashboard/ai-opinion | AI analysis |
| Wrench | Auto Fix | /dashboard/auto-fix | Automated remediation |
| Percent | Confidence | /dashboard/confidence | Analysis confidence |
| Cpu | Quantum Scan | /dashboard/quantum | Analytics timeline |
| Link | Supply Chain | /dashboard/supply-chain | Dependency tracking |
| MessageSquare | AI Chat | /dashboard/chat | Chat interface |
| Radar | Compliance | /dashboard/compliance | Compliance radar |
| FileText | Executive Report | /dashboard/report | Report viewer |

**Key Functions:**

```typescript
handleUpload() {
  // Simulates file upload process (mock)
  // Steps: 0→1→2→3→4→5 (600ms intervals)
  // Duration: ~3.6 seconds total
  Tasks: Show loading animation, process file
}

handleAutoFix() {
  // Simulates automated remediation
  // 4-second delay before updating scores
  // Updates:
  //  - securityScore: 42 → 78
  //  - fixedViolations: ["1","2","4","5","6"]
}
```

**Context Type Exported:**
```typescript
export type DashboardContextType = {
  securityScore: number;
  fixedViolations: string[];
  handleAutoFix: () => void;
};
```

**Used By:** All dashboard pages via `useOutletContext<DashboardContextType>()`

**Database Integration Points:**
- `handleUpload()` - Should send file to backend API
- `handleAutoFix()` - Should trigger backend remediation engine
- Load initial data from database on mount
- Subscribe to real-time updates

---

### Page Components (Dashboard Pages)

#### 📄 `src/app/pages/LandingPage.tsx` (Lines 1-55)
**Purpose:** Welcome/onboarding screen
**State:**
```typescript
appState: "landing" | "loading"
loadingStep: 0-5
```

**Render Flow:**
1. Show LandingHero component
2. User clicks "Start Scan"
3. Transition to LoadingScreen
4. After 5 steps (3.6s), navigate to /dashboard/graph

**Animation:** Fade transitions between states

**Tasks:**
- Display welcome message
- Handle scan initiation
- Show loading progress
- Navigate to dashboard

**Database Integration:** Store scan initiation timestamp

---

#### 📄 `src/app/pages/dashboard/GraphPage.tsx` (Lines 1-11)
**Purpose:** Network infrastructure visualization

**Renders:** GraphView component with full-width layout

**Title:** "Network Graph"

**Database Integration:** Fetch infrastructure topology data

---

#### 📄 `src/app/pages/dashboard/ScorePage.tsx` (Lines 1-15)
**Purpose:** Security score display

**Retrieves Context:**
```typescript
const { securityScore } = useOutletContext<DashboardContextType>();
```

**Renders:** ScoreDashboard component

**Props Passed:** `score={securityScore}`

**Database Integration:** Fetch score history for trends

---

#### 📄 `src/app/pages/dashboard/ViolationsPage.tsx` (Lines 1-15)
**Purpose:** Active violations and security issues

**Retrieves Context:**
```typescript
const { fixedViolations } = useOutletContext<DashboardContextType>();
```

**Renders:** ViolationPanel component

**Props Passed:** `fixedViolations={fixedViolations}`

**Database Integration:** Fetch violations from database, update on fix

---

#### 📄 `src/app/pages/dashboard/AIOpinionPage.tsx` (Lines 1-11)
**Purpose:** AI-powered security insights

**Renders:** AIOpinionPanel component

**Database Integration:** Fetch AI analysis results from backend

---

#### 📄 `src/app/pages/dashboard/AutoFixPage.tsx` (Lines 1-15)
**Purpose:** Automated remediation interface

**Retrieves Context:**
```typescript
const { handleAutoFix } = useOutletContext<DashboardContextType>();
```

**Renders:** AutoFixPanel component

**Props Passed:** `onFix={handleAutoFix}`

**Database Integration:** Trigger remediation backend, save results

---

#### 📄 `src/app/pages/dashboard/ConfidencePage.tsx` (Lines 1-11)
**Purpose:** Analysis confidence scoring

**Renders:** ConfidencePanel component

**Database Integration:** Fetch confidence metrics

---

#### 📄 `src/app/pages/dashboard/QuantumPage.tsx` (Lines 1-11)
**Purpose:** Security score timeline analytics

**Renders:** QuantumPanel component

**Database Integration:** Fetch historical score timeline

---

#### 📄 `src/app/pages/dashboard/SupplyChainPage.tsx` (Lines 1-11)
**Purpose:** Dependency and CVE tracking

**Renders:** SupplyChainPanel component

**Database Integration:** Fetch CVE database and dependency data

---

#### 📄 `src/app/pages/dashboard/ChatPage.tsx` (Lines 1-13)
**Purpose:** Interactive AI security assistant

**Renders:** ChatInterface component

**Database Integration:** Send chat messages to AI backend, store conversation

---

#### 📄 `src/app/pages/dashboard/CompliancePage.tsx` (Lines 1-11)
**Purpose:** Compliance framework radar

**Renders:** ComplianceRadar component

**Database Integration:** Fetch compliance scores for each framework

---

#### 📄 `src/app/pages/dashboard/ReportPage.tsx` (Lines 1-11)
**Purpose:** Executive security report

**Renders:** ReportViewer component

**Database Integration:** Fetch report data, generate PDF export

---

### UI/Presentational Components

#### 📄 `src/app/components/LandingHero.tsx`
**Purpose:** Landing page hero section and CTA
**Tasks:**
- Display welcome message
- Show scan button
- Render animations

---

#### 📄 `src/app/components/UploadZone.tsx` (Lines 1-102)
**Purpose:** File upload interface with drag-and-drop

**Props:**
```typescript
interface UploadZoneProps {
  onUpload: (file: File) => void;
}
```

**Features:**
- Drag-and-drop file upload
- File input selection
- Visual feedback on drag over
- Animation on drag state

**State:**
```typescript
isDragging: boolean
```

**Event Handlers:**
```typescript
handleDrop()      - Process dropped files
handleFileInput() - Process selected files
onUpload()        - Callback to parent
```

**Database Integration:** 
- Send file to backend: `POST /api/upload`
- Return file ID or scan ID

---

#### 📄 `src/app/components/LoadingScreen.tsx`
**Purpose:** Multi-step loading animation

**Props:**
```typescript
interface LoadingScreenProps {
  currentStep: 0-5
}
```

**Loading Steps (Mock):**
0. Analyzing infrastructure...
1. Scanning for vulnerabilities...
2. Checking compliance...
3. AI analysis in progress...
4. Generating report...
5. Complete!

---

#### 📄 `src/app/components/ScoreDashboard.tsx` (Lines 1-163)
**Purpose:** Animated security score gauge

**Props:**
```typescript
interface ScoreDashboardProps {
  score: number;
  previousScore?: number; // default: 35
}
```

**Features:**
- Animated counter (smooth number transition)
- Color-coded gauge (red < 60, yellow < 80, green ≥ 80)
- Trend indicator (up/down arrow)
- Glowing animation effect
- SVG circular progress indicator

**State:**
```typescript
displayScore: animated value
```

**Effects:**
```typescript
useEffect: Animates score change over 2 seconds (60 steps)
```

**Color Scheme:**
- Score < 60: Red (critical)
- Score 60-79: Yellow (warning)
- Score ≥ 80: Green (healthy)

**Database Integration:**
- Fetch current and historical scores
- Update on remediation actions

---

#### 📄 `src/app/components/GraphView.tsx` (Lines 1-355)
**Purpose:** Interactive network topology visualization

**Props:**
```typescript
interface GraphViewProps {
  data?: { nodes: Node[]; edges: Edge[] }
}

interface Node {
  id: string;
  x: number;
  y: number;
  type: "service" | "database" | "api" | "vulnerable";
  label: string;
  vulnerable?: boolean;
}

interface Edge {
  from: string;
  to: string;
  vulnerable?: boolean;
}
```

**Features:**
- Canvas-based rendering
- Node selection and highlighting
- Node hover effects
- Vulnerable node indicators
- Interactive node details

**Default Nodes (7 items):**
1. API Gateway (Service)
2. Auth Service (Service)
3. User DB (Database, vulnerable)
4. Payment API (API, vulnerable)
5. Web Server (Service)
6. Cache (Database)
7. S3 Bucket (Vulnerable)

**Default Edges (7 connections):**
- API Gateway → Auth Service
- API Gateway → User DB (vulnerable)
- Auth Service → Payment API (vulnerable)
- API Gateway → Web Server
- Web Server → Cache
- Cache → S3 Bucket (vulnerable)
- Payment API → S3 Bucket

**State:**
```typescript
selectedNode: string | null
hoveredNode: string | null
animationRef: cancellable animation
```

**Canvas Rendering:**
- Draws nodes with icons based on type
- Colors vulnerable nodes red
- Draws edges with line styling
- Updates on 60fps animation loop

**Database Integration:**
- Fetch infrastructure topology from backend
- Real-time updates on topology changes
- Store node/edge selections

---

#### 📄 `src/app/components/ViolationPanel.tsx` (Lines 1-186)
**Purpose:** Security violations and issues list

**Props:**
```typescript
interface ViolationPanelProps {
  fixedViolations?: string[] // IDs of fixed violations
}

interface Violation {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  resource: string;
  description: string;
  fixed?: boolean;
}
```

**Mock Data (7 violations):**
| ID | Title | Severity | Resource | Status |
|----|----|----------|----------|--------|
| 1 | Unencrypted S3 Bucket | critical | s3://prod-data-bucket | Active |
| 2 | Public Database Access | critical | rds://user-db-prod | Active |
| 3 | Missing MFA on Root | high | iam://root | Active |
| 4 | Overly Permissive SG | high | sg-0a1b2c3d4e5f | Active |
| 5 | Outdated TLS Version | medium | alb://api-gateway | Active |
| 6 | No Logging Enabled | medium | lambda://payment-processor | Active |
| 7 | Missing Resource Tags | low | ec2://i-1234567890 | Active |

**Features:**
- Color-coded severity badges
- Filter by severity
- Show fixed violations with checkmark
- Resource identifier display
- Sortable/filterable list

**State:**
```typescript
filter: "all" | "critical" | "high" | "medium" | "low"
```

**Severity Color Map:**
- Critical: Red
- High: Orange
- Medium: Yellow
- Low: Blue

**Database Integration:**
- Fetch violations from backend
- Update violation status after fixes
- Subscribe to new violations

---

#### 📄 `src/app/components/AIOpinionPanel.tsx` (Lines 1-121)
**Purpose:** AI-generated security insights and recommendations

**Data Structure (4 insight types):**
```typescript
interface AIInsight {
  type: "critical" | "recommendation" | "insight" | "prediction";
  title: string;
  content: string;
  confidence: 87-94
}
```

**Mock Insights:**
1. **Attack Surface Analysis** (94% confidence)
   - S3 & RDS exposure
   - 340% increased breach probability

2. **Immediate Action Required** (89% confidence)
   - Encryption recommendations
   - +28 points score increase

3. **Lateral Movement Risk** (91% confidence)
   - Overly permissive IAM roles
   - 67% infrastructure compromise risk

4. **Compliance Impact** (87% confidence)
   - SOC 2 audit failure prediction
   - 4-6 hours remediation estimate

**Features:**
- Animated insight rendering (0.2s stagger)
- Confidence percentage display
- Type-based styling
- Brain icon with pulsing animation
- Scrollable container

**Database Integration:**
- Fetch AI analysis results from ML backend
- Store analysis results with timestamps
- Track recommendation implementation

---

#### 📄 `src/app/components/AutoFixPanel.tsx` (Lines 1-122)
**Purpose:** Automated remediation execution interface

**Props:**
```typescript
interface AutoFixPanelProps {
  onFix: () => void;
}
```

**Features:**
- Show remediation progress steps
- Animate fix execution
- Success indication
- Code display (IaC changes)

**State:**
```typescript
isFixing: boolean
fixedItems: string[]
```

**Mock Fixes (5 steps, 800ms each):**
1. Enabling S3 bucket encryption...
2. Configuring VPC isolation for RDS...
3. Updating security group rules...
4. Enabling MFA on root account...
5. Applying TLS 1.2+ policy...

**Callback:** `onFix()` called after all fixes complete

**Database Integration:**
- POST remediation instructions to backend
- Store remediation history
- Return generated IaC code

---

#### 📄 `src/app/components/ChatInterface.tsx` (Lines 1-160)
**Purpose:** Interactive AI security chat assistant

**State:**
```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
}

messages: Message[]
input: string
isTyping: boolean
```

**Predefined Responses (by keyword matching):**
```typescript
default        → General help message
vulnerab*      → Vulnerabilities report
fix/remediat*  → Remediation guidance
complian*/soc  → Compliance status
score/rating   → Score explanation
```

**Features:**
- Message history display
- User/assistant avatars
- Typing indicator
- 1.5s response delay
- Scrollable message area
- Input field with send button

**Message Format:**
- User: Blue gradient, right-aligned
- Assistant: Light blue, left-aligned, bot icon

**Database Integration:**
- Send messages to NLP backend
- Store conversation history
- Provide context from infrastructure data

---

#### 📄 `src/app/components/ComplianceRadar.tsx` (Lines 1-88)
**Purpose:** Multi-framework compliance scoring visualization

**Mock Data (6 frameworks):**
```typescript
[
  { framework: "SOC 2",       score: 78  },
  { framework: "GDPR",        score: 65  },
  { framework: "PCI-DSS",     score: 82  },
  { framework: "HIPAA",       score: 71  },
  { framework: "ISO 27001",   score: 88  },
  { framework: "NIST",        score: 75  }
]
```

**Features:**
- Radar/Spider chart visualization (Recharts)
- Polar grid display
- Animated angle and radius axes
- Blue-purple gradient fill
- Full-mark score of 100

**Database Integration:**
- Fetch compliance scores from backend
- Update on remediation
- Track compliance trends

---

#### 📄 `src/app/components/ConfidencePanel.tsx` (Lines 1-79)
**Purpose:** Analysis confidence scoring display

**Props:**
```typescript
interface ConfidencePanelProps {
  confidence?: number; // default: 94
}
```

**Features:**
- Animated progress bar
- Confidence percentage display
- Color-coded indicator (red < 80, yellow < 90, green ≥ 90)
- Warning message for low confidence

**Color Scheme:**
- < 80%: Orange (low confidence)
- 80-89%: Cyan (medium confidence)
- ≥ 90%: Green (high confidence)

**Animated Elements:**
- Progress bar width animation (1s ease-out)
- Warning message fade-in

**Database Integration:**
- Fetch confidence metrics from ML model
- Store with analysis results

---

#### 📄 `src/app/components/QuantumPanel.tsx` (Lines 1-92)
**Purpose:** Security score timeline and trends

**Chart Data (7 time periods):**
```typescript
[
  { time: "00:00", score: 42 },
  { time: "04:00", score: 41 },
  { time: "08:00", score: 39 },
  { time: "12:00", score: 38 },
  { time: "16:00", score: 42 },
  { time: "20:00", score: 45 },
  { time: "Now",   score: 78 }  ← After remediation
]
```

**Features:**
- Line chart visualization (Recharts)
- X-axis: Time intervals
- Y-axis: Score (0-100)
- Tooltip on hover
- Cartesian grid

**Chart Elements:**
- CartesianGrid with dashed lines
- LineChart with gradient
- Custom tooltip styling

**Database Integration:**
- Fetch historical score data
- Real-time score updates
- Store score timeline

---

#### 📄 `src/app/components/SupplyChainPanel.tsx` (Lines 1-106)
**Purpose:** Dependency vulnerabilities and CVE tracking

**Mock CVEs (3 items):**
```typescript
[
  {
    id: "CVE-2024-1234",
    package: "log4j",
    version: "2.14.0",
    severity: "critical",
    cvss: 9.8,
    description: "Remote code execution vulnerability"
  },
  {
    id: "CVE-2024-5678",
    package: "openssl",
    version: "1.1.1k",
    severity: "high",
    cvss: 7.5,
    description: "Memory corruption in TLS handshake"
  },
  {
    id: "CVE-2024-9012",
    package: "axios",
    version: "0.21.1",
    severity: "medium",
    cvss: 5.3,
    description: "Server-side request forgery (SSRF)"
  }
]
```

**Features:**
- CVE ID display
- Package name and version
- CVSS score
- Severity color coding
- Description

**Database Integration:**
- Fetch dependency inventory
- Query CVE database
- Update vulnerability status

---

#### 📄 `src/app/components/ReportViewer.tsx` (Lines 1-105)
**Purpose:** Executive security report generation and export

**Features:**
- Executive summary
- Key findings list
- Remediation recommendations
- Download button
- Share button

**Sections:**
1. Executive Summary
2. Key Findings (7 items)
3. Remediation Steps
4. Compliance Status
5. Risk Assessment
6. Next Steps

**Actions:**
- Download PDF
- Share report (copy link/email)

**Database Integration:**
- Fetch report data from backend
- Generate PDF (server-side)
- Store report history

---

### UI Component Library

#### 📁 `src/app/components/ui/` (40+ Radix UI Components)
**Purpose:** Reusable accessible UI components

**Components Include:**
- `accordion.tsx` - Expandable sections
- `alert-dialog.tsx` - Confirm dialogs
- `alert.tsx` - Alert messages
- `button.tsx` - Button styles
- `card.tsx` - Card containers
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Menu dropdowns
- `form.tsx` - Form handling (React Hook Form)
- `input.tsx` - Text inputs
- `label.tsx` - Form labels
- `select.tsx` - Select dropdowns
- `tabs.tsx` - Tab navigation
- `table.tsx` - Data tables
- `tooltip.tsx` - Tooltips
- And 25+ more...

**Features:**
- Built on Radix UI primitives
- Tailwind CSS styling
- Accessible (ARIA compliant)
- Keyboard navigation support

---

#### 📄 `src/app/components/ui/use-mobile.ts`
**Purpose:** Mobile breakpoint detection hook

**Usage:**
```typescript
const isMobile = useMobile(); // Returns boolean
```

**Task:** Detect mobile viewport for responsive design

---

#### 📄 `src/app/components/ui/utils.ts`
**Purpose:** UI utility functions

**Common Utilities:**
- `cn()` - Class name merging (clsx + tailwind-merge)
- Color utilities
- Size utilities

---

### Image Components

#### 📄 `src/app/components/figma/ImageWithFallback.tsx`
**Purpose:** Image component with fallback support

**Features:**
- Load image from URL
- Show fallback on error
- Optimized rendering

---

## ROUTING & NAVIGATION PIPELINE

### Route Initialization Flow
```
index.html
    ↓
<script src="/src/main.tsx"></script>
    ↓
main.tsx: createRoot(document.getElementById("root")).render(<App />)
    ↓
App.tsx: <RouterProvider router={router} />
    ↓
routes.tsx: createBrowserRouter([...])
    ↓
AppRoot Component Rendered
    ↓
Outlet renders child route
```

### Navigation Flow (User Journey)
```
Landing Page (/)
    ↓ Click "Start Scan"
Loading Screen (animated 3.6s)
    ↓ Complete
Dashboard Layout (/dashboard)
    ↓
Sidebar Navigation (11 routes)
    ├─ /dashboard/graph              [GraphPage]
    ├─ /dashboard/score              [ScorePage]
    ├─ /dashboard/violations         [ViolationsPage]
    ├─ /dashboard/ai-opinion         [AIOpinionPage]
    ├─ /dashboard/auto-fix           [AutoFixPage]
    ├─ /dashboard/confidence         [ConfidencePage]
    ├─ /dashboard/quantum            [QuantumPage]
    ├─ /dashboard/supply-chain       [SupplyChainPage]
    ├─ /dashboard/chat               [ChatPage]
    ├─ /dashboard/compliance         [CompliancePage]
    └─ /dashboard/report             [ReportPage]
```

### Navigation Mechanism
- **Method:** React Router v7 with `<NavLink>` components
- **Sidebar:** Contains 11 navigation links with icons and labels
- **Active Link:** Highlighted indicator shows current page
- **Icons:** Lucide React icons

---

## CONFIGURATION & BUILD SETUP

### Build Pipeline

#### `vite.config.ts`
**Input:** TypeScript/JSX source files
**Process:**
1. React plugin transpiles JSX
2. Tailwind plugin generates CSS
3. Path alias resolution
4. Module bundling

**Output:** Optimized JavaScript bundles

**Commands:**
```bash
npm install    # Install dependencies
npm run dev    # Start dev server (http://localhost:5173)
npm run build  # Production build (./dist/)
```

### Development Server
- **Port:** 5173 (default Vite)
- **Hot Module Reloading (HMR):** Enabled
- **Source Maps:** Enabled for debugging

### Production Build
- **Output:** `./dist/` directory
- **Optimization:** 
  - Code splitting
  - Tree shaking
  - Asset minification
  - Source maps (optional)

### Asset Handling
- **CSS:** Tailwind v4 via @tailwindcss/vite
- **Images:** SVG and CSV files
- **Fonts:** Custom fonts from styles/fonts.css

---

## COMPONENT DATA FLOW

### Data Flow Architecture (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│                    Page Component                            │
│  (e.g., ScorePage.tsx)                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    useOutletContext()
                    (Get DashboardContextType)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    securityScore  fixedViolations  handleAutoFix
         │               │               │
         └───────────────┼───────────────┘
                         │
    Passed as props to child component
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ScoreDashboard ViolationPanel AutoFixPanel
    Renders UI    Renders UI     Renders UI
    with data     with data      (button handler)
```

### State Lifting Pattern
**Container (DashboardLayout):**
- Maintains shared state
- Provides context via `useOutletContext`

**Page Components (ScorePage, etc.):**
- Receive context
- Pass to child presentational components

**Presentational Components:**
- Display UI
- Call callbacks for state updates

### Data Sources (Current: All Mock)
All data is currently hardcoded/mocked:
- Violations: `mockViolations` array
- AI Insights: `aiInsights` array
- CVEs: `cveData` array
- Compliance: `complianceData` array
- Graph: `defaultData` object
- Timeline: `timelineData` array

---

## DATABASE INTEGRATION POINTS

### Where to Connect Backend API

#### 1. **Page Load - Dashboard Data Fetching**
**File:** `src/app/layouts/DashboardLayout.tsx`
**When:** `useEffect()` on component mount
**Action:** Fetch initial security score, violations, etc.

```typescript
useEffect(() => {
  // Fetch dashboard data
  fetch('/api/dashboard/summary')
    .then(r => r.json())
    .then(data => setSecurityScore(data.score));
}, []);
```

**Endpoints Needed:**
- `GET /api/dashboard/summary` - Initial dashboard data
- `GET /api/violations` - List of violations
- `GET /api/compliance` - Compliance scores
- `GET /api/infrastructure/graph` - Network topology

---

#### 2. **File Upload - Send to Backend**
**File:** `src/app/components/UploadZone.tsx`
**When:** User drops/selects file
**Action:** Send to backend for analysis

```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/scan/upload', {
    method: 'POST',
    body: formData
  });
  
  const scanId = await response.json();
  // Start polling for results
};
```

**Endpoints Needed:**
- `POST /api/scan/upload` - Upload and analyze file
- `GET /api/scan/{id}` - Poll for scan results
- `POST /api/scan/{id}/analyze` - Trigger analysis

---

#### 3. **Auto-Fix - Trigger Remediation**
**File:** `src/app/components/AutoFixPanel.tsx`
**When:** User clicks "Auto Fix" button
**Action:** Send remediation request to backend

```typescript
const handleAutoFix = async () => {
  setIsFixing(true);
  
  const response = await fetch('/api/remediation/auto-fix', {
    method: 'POST',
    body: JSON.stringify({ violations: violationIds })
  });
  
  const result = await response.json();
  // Update UI with results
  setIsFixing(false);
  onFix();
};
```

**Endpoints Needed:**
- `POST /api/remediation/auto-fix` - Execute remediation
- `GET /api/remediation/status/{id}` - Check remediation status
- `GET /api/remediation/iac/{id}` - Get generated IaC code

---

#### 4. **Chat - Send to AI Backend**
**File:** `src/app/components/ChatInterface.tsx`
**When:** User sends chat message
**Action:** Send to NLP/AI backend

```typescript
const handleSend = async () => {
  const userMessage = { role: "user", content: input };
  setMessages(prev => [...prev, userMessage]);
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: input,
      context: { score, violations }
    })
  });
  
  const aiResponse = await response.json();
  setMessages(prev => [...prev, {
    role: "assistant",
    content: aiResponse.message
  }]);
};
```

**Endpoints Needed:**
- `POST /api/chat` - Send message, get response
- `GET /api/chat/history` - Fetch conversation history
- `POST /api/chat/export` - Export conversation

---

#### 5. **Report Generation**
**File:** `src/app/components/ReportViewer.tsx`
**When:** Page loads or user requests download
**Action:** Fetch from backend, generate PDF

```typescript
useEffect(() => {
  fetch('/api/report')
    .then(r => r.json())
    .then(data => setReportData(data));
}, []);

const handleDownload = async () => {
  window.open('/api/report/download?format=pdf', '_blank');
};
```

**Endpoints Needed:**
- `GET /api/report` - Fetch report data
- `GET /api/report/download?format=pdf` - Generate and download PDF
- `POST /api/report/share` - Generate share link

---

#### 6. **Graph Topology - Fetch Infrastructure Data**
**File:** `src/app/components/GraphView.tsx`
**When:** Page loads
**Action:** Fetch infrastructure topology

```typescript
useEffect(() => {
  fetch('/api/infrastructure/topology')
    .then(r => r.json())
    .then(data => {
      setGraphData(data);
    });
}, []);
```

**Endpoints Needed:**
- `GET /api/infrastructure/topology` - Get nodes and edges
- `GET /api/infrastructure/node/{id}` - Get node details
- `POST /api/infrastructure/select/{id}` - Store node selection

---

#### 7. **Real-Time Updates**
**Technology:** WebSocket or Server-Sent Events
**Purpose:** Update UI when violations are fixed, new issues found, etc.

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://api.server/api/stream');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    
    if (update.type === 'score_updated') {
      setSecurityScore(update.score);
    } else if (update.type === 'violation_fixed') {
      setFixedViolations(prev => [...prev, update.violationId]);
    }
  };
  
  return () => ws.close();
}, []);
```

**Events to Subscribe:**
- `score_updated` - Security score changed
- `violation_fixed` - Violation resolved
- `new_violation` - New issue found
- `compliance_updated` - Compliance status changed
- `scan_progress` - Scan step update

---

### Database Schema Requirements

**Essential Tables:**

#### `users`
```sql
user_id         INT PRIMARY KEY
email           VARCHAR
password_hash   VARCHAR
created_at      TIMESTAMP
```

#### `scans`
```sql
scan_id         INT PRIMARY KEY
user_id         INT (FK)
file_name       VARCHAR
upload_date     TIMESTAMP
status          ENUM('pending', 'analyzing', 'complete')
```

#### `violations`
```sql
violation_id    INT PRIMARY KEY
scan_id         INT (FK)
title           VARCHAR
severity        ENUM('critical', 'high', 'medium', 'low')
resource        VARCHAR
description     TEXT
fixed           BOOLEAN
created_at      TIMESTAMP
```

#### `compliance_scores`
```sql
compliance_id   INT PRIMARY KEY
scan_id         INT (FK)
framework       VARCHAR ('SOC 2', 'GDPR', 'PCI-DSS', etc)
score           INT (0-100)
updated_at      TIMESTAMP
```

#### `infrastructure_topology`
```sql
node_id         INT PRIMARY KEY
scan_id         INT (FK)
type            VARCHAR
label           VARCHAR
x, y            FLOAT (coordinates)
vulnerable      BOOLEAN
```

#### `chat_history`
```sql
message_id      INT PRIMARY KEY
user_id         INT (FK)
role            ENUM('user', 'assistant')
content         TEXT
created_at      TIMESTAMP
```

#### `remediation_actions`
```sql
action_id       INT PRIMARY KEY
scan_id         INT (FK)
violation_id    INT (FK)
action_type     VARCHAR
iac_code        TEXT
status          ENUM('pending', 'applied', 'failed')
created_at      TIMESTAMP
```

---

## API/BACKEND PIPELINE REQUIREMENTS

### Recommended Backend Architecture

```
┌─────────────────────────────────────────────┐
│        Frontend (Quantum-ARES)              │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST API
                   ▼
┌─────────────────────────────────────────────┐
│     API Server (Node/Python/Go)             │
│                                              │
│  ├─ Express/FastAPI Router                  │
│  ├─ Authentication Middleware               │
│  ├─ Request Validation                      │
│  └─ Response Serialization                  │
└──────────────┬─────────────┬────────────────┘
               │             │
        ┌──────▼──────┐  ┌────▼─────────┐
        ▼             ▼  ▼              ▼
   [Security    [AI/ML      [Scanner   [Report
    Analysis    Backend]    Engine]    Generator]
    Engine]
        │             │      │              │
        └──────┬──────┴──────┴──────────────┘
               │
        ┌──────▼──────────────┐
        │   Database Layer    │
        │                     │
        ├─ PostgreSQL/MySQL   │
        ├─ Redis (Cache)      │
        └─ File Storage       │
```

### Required API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/register` - New user registration

#### Dashboard
- `GET /api/dashboard/summary` - Summary metrics
- `GET /api/dashboard/status` - Current status

#### Scans
- `POST /api/scan/upload` - Upload file for analysis
- `GET /api/scan/{id}` - Get scan details
- `GET /api/scan/{id}/results` - Detailed results
- `POST /api/scan/{id}/analyze` - Trigger analysis

#### Violations
- `GET /api/violations` - List all violations
- `GET /api/violations/{id}` - Get violation details
- `PATCH /api/violations/{id}` - Update violation status
- `DELETE /api/violations/{id}` - Mark as resolved

#### Infrastructure
- `GET /api/infrastructure/topology` - Network topology
- `GET /api/infrastructure/node/{id}` - Node details
- `POST /api/infrastructure/node/{id}/details` - Store details

#### Compliance
- `GET /api/compliance` - All compliance scores
- `GET /api/compliance/{framework}` - Framework-specific score
- `GET /api/compliance/report` - Full compliance report

#### Remediation
- `POST /api/remediation/auto-fix` - Auto-fix violations
- `GET /api/remediation/status/{id}` - Remediation status
- `GET /api/remediation/iac/{id}` - Generated IaC code
- `GET /api/remediation/history` - Remediation history

#### AI Analysis
- `POST /api/ai/analyze` - AI analysis request
- `POST /api/ai/insights` - Get AI insights

#### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history` - Chat history
- `POST /api/chat/export` - Export conversation

#### Reports
- `GET /api/report` - Get report data
- `GET /api/report/download?format=pdf` - Download PDF
- `POST /api/report/share` - Generate share link
- `GET /api/report/email` - Email report

#### Security
- `GET /api/security/score` - Security score
- `GET /api/security/score/history` - Score history
- `GET /api/security/threats` - Active threats

---

## STATE MANAGEMENT ARCHITECTURE

### Current State Management (Mock)
**Pattern:** Local Component State (React Hooks)

```typescript
// DashboardLayout.tsx
const [securityScore, setSecurityScore] = useState(42);
const [fixedViolations, setFixedViolations] = useState<string[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [loadingStep, setLoadingStep] = useState(0);

// Passed to children via useOutletContext()
```

### Recommended State Management for DB Integration

#### Option 1: React Query (Simple, Recommended)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

function DashboardLayout() {
  // Fetch dashboard data on mount
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json())
  });
  
  // Mutations for updates
  const fixMutation = useMutation((violationId) =>
    fetch('/api/violations/fix', {
      method: 'POST',
      body: JSON.stringify({ violationId })
    })
  );
  
  return (
    // Components receive data and mutations
  );
}
```

#### Option 2: Zustand (Lightweight)
```typescript
import { create } from 'zustand';

const useAppStore = create((set) => ({
  securityScore: 42,
  setSecurityScore: (score) => set({ securityScore: score }),
  fixedViolations: [],
  addFixedViolation: (id) => set((state) => ({
    fixedViolations: [...state.fixedViolations, id]
  }))
}));

// In components:
const { securityScore, setSecurityScore } = useAppStore();
```

#### Option 3: Redux (Enterprise)
```typescript
// actions/dashboardActions.ts
export const fetchDashboardData = () => async (dispatch) => {
  const data = await fetch('/api/dashboard').then(r => r.json());
  dispatch({ type: 'SET_DASHBOARD_DATA', payload: data });
};

// In components:
const { securityScore } = useSelector(state => state.dashboard);
const dispatch = useDispatch();
```

---

## USER JOURNEY & WORKFLOWS

### User Flow 1: Initial Security Scan
```
1. User lands on LandingPage (/)
2. Reads welcome message
3. Clicks "Start Scan" button
   ├─ State: appState = "loading"
   ├─ LoadingScreen shows steps 0-5
   └─ Each step takes 600ms
4. After 3.6s, navigates to /dashboard
5. DashboardLayout renders with sidebar
6. Security score displays (42/100)
7. User can explore violation details
```

### User Flow 2: Analyze Violations
```
1. User on /dashboard/violations
2. See list of 7 mock violations
3. Click on violation item
4. View details:
   ├─ Severity (critical/high/medium/low)
   ├─ Resource identifier
   ├─ Description
   └─ Status (active/fixed)
5. Filter violations by severity
6. See count of each severity type
```

### User Flow 3: Auto-Fix Remediation
```
1. User on /dashboard/auto-fix
2. Click "Auto Fix" button
3. AutoFixPanel starts process:
   ├─ Step 1: Enabling S3 encryption (800ms)
   ├─ Step 2: VPC isolation (800ms)
   ├─ Step 3: Security groups (800ms)
   ├─ Step 4: MFA enabling (800ms)
   └─ Step 5: TLS update (800ms)
4. After 4s delay, score updates:
   ├─ Score: 42 → 78
   ├─ Fixed violations: ["1","2","4","5","6"]
   └─ Success notification
5. Security Score page shows new score
```

### User Flow 4: Chat with AI Assistant
```
1. User on /dashboard/chat
2. Type question about security
3. Press send button
4. Message appears in chat
5. AI responds after 1.5s:
   ├─ Keywords trigger predefined responses
   ├─ Matches: vulnerabilities, fix, compliance, score
   └─ Default message if no match
6. Response appears left-aligned with bot icon
7. User can see full conversation history
```

### User Flow 5: View Network Graph
```
1. User on /dashboard/graph
2. Canvas shows 7 nodes:
   ├─ API Gateway (center)
   ├─ Auth Service
   ├─ User DB (vulnerable)
   ├─ Payment API (vulnerable)
   ├─ Web Server
   ├─ Cache
   └─ S3 Bucket (vulnerable)
3. Edges show connections (7 total)
   ├─ Vulnerable edges highlighted
   ├─ Color-coded by risk
4. Hover over nodes → tooltip
5. Click node → select node
6. Selected node highlighted
```

### User Flow 6: Export Report
```
1. User on /dashboard/report
2. View report sections:
   ├─ Executive Summary
   ├─ Key Findings (7 items)
   ├─ Remediation Steps
   ├─ Compliance Status
   ├─ Risk Assessment
   └─ Next Steps
3. Click Download button
   └─ Generates PDF
4. Click Share button
   └─ Creates share link
```

---

## EXTERNAL DEPENDENCIES & LIBRARIES

### Frontend Framework
- **react** (18.3.1) - UI framework
- **react-dom** (18.3.1) - React DOM rendering
- **react-router** (7.13.0) - Client routing

### Styling
- **tailwindcss** (4.1.12) - CSS utility framework
- **@tailwindcss/vite** (4.1.12) - Tailwind Vite integration
- **tailwind-merge** (3.2.0) - Merge Tailwind classes
- **class-variance-authority** (0.7.1) - Component variants
- **next-themes** (0.4.6) - Theme management

### UI Components (Radix UI)
- 30+ Radix UI components for accessible primitives
- Material-UI Icons (7.3.5)
- Lucide React (0.487.0) - Icon library

### Animations & Motion
- **motion** (12.23.24) - Framer Motion alternative
- **canvas-confetti** (1.9.4) - Confetti animation
- **react-slick** (0.31.0) - Carousel

### Form & Input
- **react-hook-form** (7.55.0) - Form management
- **input-otp** (1.4.2) - OTP input component
- **cmdk** (1.1.1) - Command palette

### Data Visualization
- **recharts** (2.15.2) - React charting library

### Drag & Drop
- **react-dnd** (16.0.1) - Drag and drop
- **react-dnd-html5-backend** (16.0.1) - HTML5 backend

### Layout & Resizing
- **react-resizable-panels** (2.1.7) - Resizable panels
- **react-responsive-masonry** (2.7.1) - Masonry layout
- **embla-carousel-react** (8.6.0) - Carousel

### Other
- **date-fns** (3.6.0) - Date utilities
- **clsx** (2.1.1) - Class name utilities
- **sonner** (2.0.3) - Toast notifications
- **vaul** (1.1.2) - Drawer component
- **react-day-picker** (8.10.1) - Date picker
- **react-popper** (2.3.0) - Positioning
- **@popperjs/core** (2.11.8) - Popper.js
- **@emotion/react** (11.14.0) - CSS-in-JS
- **@emotion/styled** (11.14.1) - Styled components
- **@mui/material** (7.3.5) - Material Design
- **tw-animate-css** (1.3.8) - Animation utilities

### Build Tools
- **vite** (6.3.5) - Build tool
- **@vitejs/plugin-react** (4.7.0) - React plugin

---

## INTEGRATION CHECKLIST FOR DATABASE CONNECTION

### Phase 1: Setup Backend Infrastructure
- [ ] Choose backend framework (Node.js, Python, Go, etc.)
- [ ] Setup database (PostgreSQL, MongoDB, MySQL)
- [ ] Create API endpoints (see section: Required API Endpoints)
- [ ] Implement authentication (JWT, OAuth2, etc.)
- [ ] Setup CORS for frontend communication
- [ ] Implement request validation and sanitization
- [ ] Add error handling and logging

### Phase 2: Install API Client Libraries
**In package.json, add:**
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "zustand": "^4.4.0"
  }
}
```

Commands:
```bash
npm install axios @tanstack/react-query zustand
```

### Phase 3: Create API Client
**File: `src/services/api.ts`**
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export API methods
export const dashboardAPI = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getViolations: () => apiClient.get('/violations'),
  getCompliance: () => apiClient.get('/compliance'),
};

export const scanAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/scan/upload', formData);
  },
  getResults: (scanId: string) => apiClient.get(`/scan/${scanId}/results`),
};

// ... More API methods
```

### Phase 4: Replace Mock Data with Real API Calls

**DashboardLayout.tsx:**
```typescript
useEffect(() => {
  dashboardAPI.getSummary()
    .then(res => setSecurityScore(res.data.score))
    .catch(err => console.error(err));
}, []);
```

**GraphView.tsx:**
```typescript
useEffect(() => {
  dashboardAPI.getInfrastructureTopology()
    .then(res => setGraphData(res.data))
    .catch(err => console.error(err));
}, []);
```

**UploadZone.tsx:**
```typescript
const handleUpload = async (file: File) => {
  try {
    const res = await scanAPI.uploadFile(file);
    const scanId = res.data.scanId;
    // Poll for results
  } catch (err) {
    console.error('Upload failed:', err);
  }
};
```

### Phase 5: Add Error Handling
- [ ] Implement error boundaries in React
- [ ] Add toast notifications for errors
- [ ] Implement retry logic for failed requests
- [ ] Add loading states for all async operations
- [ ] Handle network timeouts gracefully

### Phase 6: Add Authentication
- [ ] Implement login page
- [ ] Store JWT token securely
- [ ] Add token refresh logic
- [ ] Implement logout functionality
- [ ] Protect routes with auth checks

### Phase 7: Performance Optimization
- [ ] Implement caching strategy (React Query)
- [ ] Add pagination for large lists
- [ ] Implement infinite scroll where needed
- [ ] Optimize API calls (debounce, throttle)
- [ ] Add service worker for offline support

### Phase 8: Testing
- [ ] Write unit tests for components
- [ ] Write integration tests for API calls
- [ ] Test error scenarios
- [ ] Test authentication flows
- [ ] Load testing for concurrent users

### Phase 9: Deployment
- [ ] Setup environment variables (.env files)
- [ ] Configure CORS properly for production
- [ ] Setup SSL/TLS certificates
- [ ] Configure database backups
- [ ] Setup monitoring and logging
- [ ] Document API endpoints
- [ ] Create deployment documentation

### Phase 10: Security
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Implement SQL injection prevention
- [ ] Add XSS protection
- [ ] Encrypt sensitive data
- [ ] Implement 2FA if needed
- [ ] Regular security audits

---

## SUMMARY TABLE: FILE-TO-FUNCTIONALITY MAPPING

| File Path | Type | Purpose | Inputs | Outputs | DB Integration |
|-----------|------|---------|--------|---------|-----------------|
| `main.tsx` | Entry | Bootstrap React app | HTML #root | React DOM | N/A |
| `App.tsx` | Component | Router wrapper | Router config | React Router | Add API context |
| `routes.tsx` | Config | Route definitions | Route paths | Route tree | N/A |
| `AppRoot.tsx` | Layout | Root layout | Child routes | Layout wrapper | N/A |
| `DashboardLayout.tsx` | Layout | Dashboard shell + state | Context | Page outlets + context | Fetch summary, upload, auto-fix |
| `LandingPage.tsx` | Page | Landing/onboarding | Navigation | Hero + loading | Log scan initiation |
| `GraphPage.tsx` | Page | Network visualization | Data prop | Graph canvas | Fetch topology |
| `ScorePage.tsx` | Page | Score display | Context | Score UI | Fetch score history |
| `ViolationsPage.tsx` | Page | Violations list | Context | List UI | Fetch/update violations |
| `AIOpinionPage.tsx` | Page | AI insights | None | Insights UI | Fetch AI analysis |
| `AutoFixPage.tsx` | Page | Remediation | Context | Remediation UI | Trigger auto-fix API |
| `ConfidencePage.tsx` | Page | Confidence | None | Progress bar | Fetch confidence score |
| `QuantumPage.tsx` | Page | Analytics | None | Timeline chart | Fetch score history |
| `SupplyChainPage.tsx` | Page | CVE tracking | None | CVE list | Fetch CVE data |
| `ChatPage.tsx` | Page | AI chat | None | Chat UI | Send to AI API |
| `CompliancePage.tsx` | Page | Compliance | None | Radar chart | Fetch compliance scores |
| `ReportPage.tsx` | Page | Report viewer | None | Report UI | Fetch report data |
| `GraphView.tsx` | Component | Network canvas | topology data | SVG canvas | Poll for topology updates |
| `ScoreDashboard.tsx` | Component | Score gauge | score prop | Animated circle | Display score data |
| `UploadZone.tsx` | Component | File upload | onUpload prop | File upload | Send to /api/scan/upload |
| `ViolationPanel.tsx` | Component | Violations list | violations prop | HTML list | Fetch/display violations |
| `AIOpinionPanel.tsx` | Component | AI insights | None | Text cards | Display AI insights |
| `AutoFixPanel.tsx` | Component | Remediation UI | onFix prop | Progress steps | Execute remediation API |
| `ChatInterface.tsx` | Component | Chat UI | None | Messages list | Send/receive chat API |
| `ComplianceRadar.tsx` | Component | Compliance chart | compliance prop | Radar chart | Display compliance data |
| `ConfidencePanel.tsx` | Component | Confidence bar | confidence prop | Progress bar | Display confidence |
| `QuantumPanel.tsx` | Component | Timeline chart | timeline prop | Line chart | Display historical data |
| `SupplyChainPanel.tsx` | Component | CVE list | CVEs prop | HTML list | Display CVE data |
| `ReportViewer.tsx` | Component | Report display | report prop | HTML content | Display report data |

---

## RECOMMENDED NEXT STEPS

### Immediate (Week 1)
1. Design backend API schema
2. Setup Express/FastAPI backend
3. Create database schema
4. Implement authentication
5. Create API client in frontend

### Short-term (Week 2-3)
1. Replace mock data with real API calls
2. Implement error handling
3. Add loading states
4. Setup environment variables
5. Basic testing

### Medium-term (Week 4+)
1. Implement caching strategy
2. Add real-time updates (WebSocket)
3. Performance optimization
4. Comprehensive testing
5. Security hardening
6. Documentation

### Long-term
1. Multi-tenant support
2. Advanced analytics
3. ML/AI integration
4. Mobile app
5. Scalability improvements

---

## CONTACT & SUPPORT

For questions about this technical report or implementation guidance, please refer to:
- **Primary Framework:** React 18.3.1 with React Router 7.13.0
- **Build Tool:** Vite 6.3.5
- **Database:** (To be determined)
- **Backend:** (To be determined)

---

**Report Generated:** March 22, 2026  
**Application Version:** 0.0.1  
**Tech Stack:** React + TypeScript + Tailwind + Vite

---
