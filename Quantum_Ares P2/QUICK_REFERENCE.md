# QUANTUM-ARES: Quick Reference & Integration Guide

## 📋 Quick File Reference

### Core Files
```
src/
├── main.tsx                    ← Entry point (renders App)
├── app/
│   ├── App.tsx                 ← RouterProvider wrapper
│   ├── routes.tsx              ← All route definitions
│   ├── AppRoot.tsx             ← Root layout
│   ├── layouts/
│   │   └── DashboardLayout.tsx ← Dashboard state + sidebar (HAS STATE!)
│   ├── pages/
│   │   ├── LandingPage.tsx      ← Initial landing page
│   │   └── dashboard/
│   │       ├── GraphPage.tsx    ← Network visualization
│   │       ├── ScorePage.tsx    ← Security score
│   │       ├── ViolationsPage.tsx ← Issues list
│   │       ├── AIOpinionPage.tsx ← AI insights
│   │       ├── AutoFixPage.tsx  ← Remediation
│   │       ├── ConfidencePage.tsx ← AI confidence
│   │       ├── QuantumPage.tsx  ← Timeline analytics
│   │       ├── SupplyChainPage.tsx ← CVE tracking
│   │       ├── ChatPage.tsx     ← AI chat
│   │       ├── CompliancePage.tsx ← Compliance radar
│   │       └── ReportPage.tsx   ← Executive report
│   ├── components/
│   │   ├── GraphView.tsx       ← Network canvas (355 lines)
│   │   ├── ScoreDashboard.tsx  ← Score gauge (163 lines)
│   │   ├── ViolationPanel.tsx  ← Violations list (186 lines)
│   │   ├── ChatInterface.tsx   ← Chat UI (160 lines)
│   │   ├── AIOpinionPanel.tsx  ← AI insights
│   │   ├── AutoFixPanel.tsx    ← Remediation UI
│   │   ├── ComplianceRadar.tsx ← Compliance chart
│   │   ├── ConfidencePanel.tsx ← Confidence bar
│   │   ├── QuantumPanel.tsx    ← Timeline chart
│   │   ├── SupplyChainPanel.tsx ← CVE list
│   │   ├── ReportViewer.tsx    ← Report display
│   │   ├── UploadZone.tsx      ← File upload (102 lines)
│   │   ├── LoadingScreen.tsx   ← Loading animation
│   │   ├── LandingHero.tsx     ← Landing hero
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── ui/                 ← 40+ Radix UI components
│   └── styles/
│       ├── index.css           ← Import orchestrator
│       ├── fonts.css           ← Font definitions
│       ├── tailwind.css        ← Tailwind utilities
│       └── theme.css           ← Custom theme

Configuration Files:
├── package.json                ← Dependencies (50+)
├── vite.config.ts              ← Build config
├── postcss.config.mjs          ← PostCSS config (empty)
├── pnpm-workspace.yaml         ← Monorepo config
├── tailwind.config.ts          ← Tailwind config
├── index.html                  ← HTML entry
├── tsconfig.json               ← TypeScript config
└── .env.example                ← Environment variables (if exists)
```

---

## 🎯 Component Purpose Matrix

| Component | Purpose | Has State | Uses Context | DB Connect Point |
|-----------|---------|-----------|--------------|-----------------|
| DashboardLayout | Main shell + state | ✅ YES | Provides `DashboardContextType` | ✅ Fetch data |
| LandingPage | Onboarding | ✅ YES (appState, step) | ❌ No | ✅ Log initiation |
| GraphView | Infrastructure viz | ✅ YES (selections) | ❌ No | ✅ Fetch topology |
| ScoreDashboard | Score display | ✅ YES (animated) | ❌ No | ✅ Display data |
| ViolationPanel | Issues list | ✅ YES (filter) | ❌ No | ✅ Display data |
| ChatInterface | Chat UI | ✅ YES (messages) | ❌ No | ✅ Send messages |
| AIOpinionPanel | AI insights | ❌ No | ❌ No | ✅ Display data |
| AutoFixPanel | Remediation | ✅ YES (isFixing) | ❌ No | ✅ Trigger API |
| ComplianceRadar | Compliance chart | ❌ No | ❌ No | ✅ Display data |
| ConfidencePanel | Confidence bar | ❌ No | ❌ No | ✅ Display data |
| QuantumPanel | Timeline chart | ❌ No | ❌ No | ✅ Display data |
| SupplyChainPanel | CVE list | ❌ No | ❌ No | ✅ Display data |
| ReportViewer | Report display | ❌ No | ❌ No | ✅ Display data |
| UploadZone | File upload | ✅ YES (isDragging) | ❌ No | ✅ Send file |

---

## 🔌 Integration Points for Database

### Priority 1: CRITICAL (Do First)
These are the main data flows that everything depends on.

#### 1. DashboardLayout - Fetch Initial Data
**File:** `src/app/layouts/DashboardLayout.tsx`
**Current:** Mock state with hardcoded values
```typescript
// BEFORE (Mock)
const [securityScore, setSecurityScore] = useState(42);
const [fixedViolations, setFixedViolations] = useState<string[]>([]);

// AFTER (With API)
useEffect(() => {
  fetchDashboardData().then(data => {
    setSecurityScore(data.score);
    setFixedViolations(data.fixedViolations);
  });
}, []);
```
**API Needed:** `GET /api/dashboard/summary`
**Returns:** `{ score: number, fixedViolations: string[], timestamp: Date }`

#### 2. UploadZone - Send File to Backend
**File:** `src/app/components/UploadZone.tsx`
**Current:** Mock - just accepts file, does nothing
```typescript
// BEFORE (Mock)
const handleUpload = (file: File) => {
  onUpload(file); // Just passes file
};

// AFTER (With API)
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/scan/upload', {
    method: 'POST',
    body: formData
  });
  const scanId = await response.json();
  // Pass scan ID to DashboardLayout for polling
  onUpload(scanId);
};
```
**API Needed:** `POST /api/scan/upload` → Returns `{ scanId: string }`

#### 3. AutoFixPanel - Trigger Remediation
**File:** `src/app/components/AutoFixPanel.tsx`
**Current:** Mock - just updates state after 4 seconds
```typescript
// BEFORE (Mock)
const handleAutoFix = async () => {
  setIsFixing(true);
  // Simulates 5 steps with artificial delays
  // Then calls onFix()
};

// AFTER (With API)
const handleAutoFix = async () => {
  setIsFixing(true);
  try {
    const response = await fetch('/api/remediation/auto-fix', {
      method: 'POST',
      body: JSON.stringify({ scanId })
    });
    const result = await response.json();
    // Update UI with actual fixes performed
    onFix(); // Callback to DashboardLayout
  } catch (err) {
    console.error('Auto-fix failed:', err);
  } finally {
    setIsFixing(false);
  }
};
```
**API Needed:** `POST /api/remediation/auto-fix` → Returns `{ status, fixes: [] }`

### Priority 2: HIGH (Do Next)

#### 4. ViolationPanel - Load Violations
**File:** `src/app/components/ViolationPanel.tsx`
**Current:** `mockViolations` array (7 items hardcoded)
```typescript
// BEFORE: 
const mockViolations: Violation[] = [/* 7 hardcoded items */];

// AFTER:
useEffect(() => {
  fetchViolations().then(setViolations);
}, []);
```
**API Needed:** `GET /api/violations` → Returns `Violation[]`

#### 5. GraphView - Load Infrastructure Topology
**File:** `src/app/components/GraphView.tsx`
**Current:** `defaultData` with 7 mock nodes and 7 edges
```typescript
// BEFORE:
const defaultData = { nodes: [...], edges: [...] };

// AFTER:
useEffect(() => {
  fetchInfrastructureTopology().then(setGraphData);
}, []);
```
**API Needed:** `GET /api/infrastructure/topology` → Returns `{ nodes: Node[], edges: Edge[] }`

#### 6. ChatInterface - Connect to AI Backend
**File:** `src/app/components/ChatInterface.tsx`
**Current:** Keyword-matching with predefined responses
```typescript
// BEFORE:
const predefinedResponses = {
  default: "...",
  vulnerabilities: "..."
};

// AFTER:
const handleSend = async () => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: input })
  });
  const aiResponse = await response.json();
  setMessages(prev => [...prev, aiResponse]);
};
```
**API Needed:** `POST /api/chat` → Returns `{ role, content, confidence }`

### Priority 3: MEDIUM (Polish)

#### 7. Other Dashboard Pages
All other pages load their data similarly:

**CompliancePage** → `GET /api/compliance`
**QuantumPage** → `GET /api/score/history`
**SupplyChainPage** → `GET /api/dependency/cves`
**AIOpinionPage** → `GET /api/ai/insights`
**ConfidencePage** → `GET /api/analysis/confidence`
**ReportPage** → `GET /api/report`

---

## 🗄️ Database Schema (Recommended)

### Core Tables

```sql
-- Users & Auth
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scans (main entity)
CREATE TABLE scans (
  scan_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id),
  file_name VARCHAR(255),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'analyzing', 'complete', 'failed'),
  security_score INT DEFAULT 0,
  analyzed_at TIMESTAMP
);

-- Violations (what's wrong)
CREATE TABLE violations (
  violation_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  title VARCHAR(255) NOT NULL,
  severity ENUM('critical', 'high', 'medium', 'low'),
  resource VARCHAR(255),
  description TEXT,
  fixed BOOLEAN DEFAULT FALSE,
  fixed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance scores (frameworks)
CREATE TABLE compliance_scores (
  compliance_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  framework VARCHAR(50), -- 'SOC 2', 'GDPR', 'PCI-DSS', etc
  score INT CHECK (score >= 0 AND score <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scan_id, framework)
);

-- Infrastructure nodes
CREATE TABLE infrastructure_nodes (
  node_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  type VARCHAR(50), -- 'service', 'database', 'api', 'vulnerable'
  label VARCHAR(255),
  x FLOAT, y FLOAT, -- coordinates
  vulnerable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Infrastructure edges (connections)
CREATE TABLE infrastructure_edges (
  edge_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  from_node_id INT REFERENCES infrastructure_nodes(node_id),
  to_node_id INT REFERENCES infrastructure_nodes(node_id),
  vulnerable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history
CREATE TABLE chat_messages (
  message_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  role ENUM('user', 'assistant'),
  content TEXT NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Remediation history
CREATE TABLE remediation_actions (
  action_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  violation_id INT REFERENCES violations(violation_id),
  action_type VARCHAR(100),
  iac_code TEXT, -- Infrastructure as Code solution
  status ENUM('pending', 'applied', 'failed'),
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE reports (
  report_id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(scan_id),
  report_data JSON,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exported_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_violations_scan_id ON violations(scan_id);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_compliance_scan_id ON compliance_scores(scan_id);
CREATE INDEX idx_nodes_scan_id ON infrastructure_nodes(scan_id);
CREATE INDEX idx_chat_scan_id ON chat_messages(scan_id);
CREATE INDEX idx_remediation_scan_id ON remediation_actions(scan_id);
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Initial Dashboard Load
```
User visits /dashboard
         ↓
DashboardLayout mounts
         ↓
useEffect: fetchDashboardData()
         ↓
GET /api/dashboard/summary
         ↓
DB: SELECT * FROM scans WHERE scan_id = ? LIMIT 1
         ↓
Response: { score: 42, fixedViolations: [] }
         ↓
setSecurityScore(42)
setFixedViolations([])
         ↓
Components receive via useOutletContext()
         ↓
UI renders with data
```

### Flow 2: File Upload & Analysis
```
User drags file to UploadZone
         ↓
handleDrop(file)
         ↓
onUpload → DashboardLayout
         ↓
POST /api/scan/upload (FormData)
         ↓
Backend:
  - Save file to storage
  - Create scan record
  - Queue analysis job
         ↓
Response: { scanId: 123 }
         ↓
DashboardLayout: setIsUploading(true)
         ↓
Poll GET /api/scan/123/status
         ↓
When status == 'complete':
  - Fetch violations
  - Update score
  - Parse results
         ↓
UI updates with new data
```

### Flow 3: Auto-Fix Process
```
User clicks "Auto Fix"
         ↓
AutoFixPanel.handleAutoFix()
         ↓
POST /api/remediation/auto-fix { scanId, violations }
         ↓
Backend:
  - Generate IaC code
  - Execute remediation
  - Validate fixes
  - Update violation status
         ↓
Response: { status: 'success', fixedViolations: [1,2,4,5,6] }
         ↓
setIsFixing(false)
onFix() callback
         ↓
DashboardLayout:
  - handleAutoFix()
  - setSecurityScore(78)
  - setFixedViolations([1,2,4,5,6])
         ↓
All dependent components re-render
  - ScorePage shows new score
  - ViolationPanel marks violations as fixed
  - ReportPage gets new data
```

### Flow 4: Chat Interaction
```
User types question & sends
         ↓
ChatInterface: handleSend()
         ↓
Add user message to state
         ↓
POST /api/chat { message, context: { score, violations } }
         ↓
Backend:
  - Process with NLP/AI
  - Generate response
  - Store in conversation
         ↓
Response: { content, confidence, type }
         ↓
Add assistant message to state
         ↓
Messages append to UI
```

---

## 🛠️ Development Workflow

### Setup for Development

#### Step 1: Install Dependencies
```bash
cd Quantum-ARES
npm install
# OR
pnpm install
```

#### Step 2: Start Dev Server
```bash
npm run dev
# OR
pnpm dev
```
Server runs at: `http://localhost:5173`

#### Step 3: Create `.env` File
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Quantum ARES
```

#### Step 4: Create API Client (`src/services/api.ts`)
```typescript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth failure
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export API methods by feature
export const dashboardAPI = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getViolations: () => apiClient.get('/violations'),
  getCompliance: () => apiClient.get('/compliance'),
  getInfrastructure: () => apiClient.get('/infrastructure/topology')
};

export const scanAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/scan/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getStatus: (scanId: string) => apiClient.get(`/scan/${scanId}/status`)
};

export const remediationAPI = {
  autoFix: (scanId: string) => apiClient.post('/remediation/auto-fix', { scanId }),
  getStatus: (actionId: string) => apiClient.get(`/remediation/${actionId}/status`)
};

export const chatAPI = {
  sendMessage: (message: string, context: any) =>
    apiClient.post('/chat', { message, context }),
  getHistory: (scanId: string) => apiClient.get(`/chat/history/${scanId}`)
};

export const reportAPI = {
  getReport: (scanId: string) => apiClient.get(`/report/${scanId}`),
  downloadPDF: (scanId: string) => apiClient.get(`/report/${scanId}/download`),
  shareReport: (scanId: string) => apiClient.post(`/report/${scanId}/share`)
};
```

#### Step 5: Replace Mock Data

**Example: DashboardLayout.tsx**
```typescript
import { dashboardAPI } from '../services/api';

export function DashboardLayout() {
  const [securityScore, setSecurityScore] = useState(42);
  const [fixedViolations, setFixedViolations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: Fetch real data
  useEffect(() => {
    dashboardAPI.getSummary()
      .then(res => {
        setSecurityScore(res.data.score);
        setFixedViolations(res.data.fixedViolations);
      })
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingScreen />;

  // ... rest of component
}
```

---

## 📊 Component Hierarchy

```
App.tsx
└── RouterProvider
    └── createBrowserRouter
        └── AppRoot.tsx
            ├── / (LandingPage)
            │   ├── LandingHero
            │   └── LoadingScreen
            │
            └── /dashboard (DashboardLayout)  [STATE HERE]
                ├── Sidebar Navigation
                ├── Upload Zone
                └── Outlet
                    ├── /dashboard/graph
                    │   └── GraphPage
                    │       └── GraphView
                    ├── /dashboard/score
                    │   └── ScorePage
                    │       └── ScoreDashboard
                    ├── /dashboard/violations
                    │   └── ViolationsPage
                    │       └── ViolationPanel
                    ├── /dashboard/ai-opinion
                    │   └── AIOpinionPage
                    │       └── AIOpinionPanel
                    ├── /dashboard/auto-fix
                    │   └── AutoFixPage
                    │       └── AutoFixPanel
                    ├── /dashboard/confidence
                    │   └── ConfidencePage
                    │       └── ConfidencePanel
                    ├── /dashboard/quantum
                    │   └── QuantumPage
                    │       └── QuantumPanel
                    ├── /dashboard/supply-chain
                    │   └── SupplyChainPage
                    │       └── SupplyChainPanel
                    ├── /dashboard/chat
                    │   └── ChatPage
                    │       └── ChatInterface
                    ├── /dashboard/compliance
                    │   └── CompliancePage
                    │       └── ComplianceRadar
                    └── /dashboard/report
                        └── ReportPage
                            └── ReportViewer
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Replace all mock data with real API calls
- [ ] Test all API integrations
- [ ] Test error handling
- [ ] Test authentication flow
- [ ] Performance test (Lighthouse)
- [ ] Security audit (XSS, CSRF, SQL Injection checks)
- [ ] Cross-browser testing

### Build & Deployment
- [ ] `npm run build` produces ./dist
- [ ] Upload dist to hosting (Vercel, Netlify, AWS S3, etc.)
- [ ] Setup CORS on backend
- [ ] Setup SSL/TLS certificates
- [ ] Configure environment variables
- [ ] Test in production environment
- [ ] Setup monitoring and logging
- [ ] Configure backup strategy

### Post-Deployment
- [ ] Monitor error logs
- [ ] Monitor API response times
- [ ] Monitor user activity
- [ ] Be ready to rollback if needed

---

## 🎓 Key Concepts

### Context API Pattern
```typescript
// Parent (DashboardLayout)
export type DashboardContextType = {
  securityScore: number;
  fixedViolations: string[];
  handleAutoFix: () => void;
};

// Child (ScorePage)
const { securityScore } = useOutletContext<DashboardContextType>();
```

### Component Props Pattern
```typescript
// Parent passes data
<ScoreDashboard score={securityScore} />

// Child receives and displays
interface Props { score: number }
export function ScoreDashboard({ score }: Props) { ... }
```

### State Lifting Pattern
- DashboardLayout: Owns state (score, violations)
- Page components: Receive data via context
- Presentation components: Just render, no state

---

## 📞 Support Resources

- **React:** https://react.dev
- **React Router:** https://reactrouter.com
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com
- **Motion (Framer):** https://motion.dev
- **Recharts:** https://recharts.org
- **Vite:** https://vitejs.dev

---

**Last Updated:** March 22, 2026  
**Version:** 1.0
