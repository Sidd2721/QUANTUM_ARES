# QUANTUM-ARES: Database Integration Implementation Guide

**Last Updated:** March 22, 2026

## 📦 Step 1: Install Required Dependencies

```bash
npm install axios @tanstack/react-query zustand react-custom-hooks
```

OR with pnpm:
```bash
pnpm add axios @tanstack/react-query zustand react-custom-hooks
```

**What each does:**
- `axios` - HTTP client for API calls
- `@tanstack/react-query` - Server state management (caching, refetching)
- `zustand` - Lightweight client state management
- `react-custom-hooks` - Utility hooks

---

## 🔧 Step 2: Create Environment Configuration

**File: `.env.local`**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=Quantum ARES
VITE_APP_VERSION=0.0.1

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_AUTO_FIX=true
VITE_ENABLE_REPORTS=true
```

**File: `.env.production`**
```env
VITE_API_BASE_URL=https://api.quantum-ares.com/api
VITE_API_TIMEOUT=30000
```

**Usage in code:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT;
```

---

## 🌐 Step 3: Create API Client

**File: `src/services/apiClient.ts`**
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📡 Step 4: Create API Service Methods

**File: `src/services/dashboardAPI.ts`**
```typescript
import apiClient from './apiClient';

export interface DashboardSummary {
  score: number;
  fixedViolations: string[];
  violations: Violation[];
  compliance: ComplianceScore[];
  lastUpdate: string;
}

export interface Violation {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource: string;
  description: string;
  fixed: boolean;
}

export interface ComplianceScore {
  framework: string;
  score: number;
}

// Fetch dashboard summary
export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    throw error;
  }
};

// Fetch violations list
export const fetchViolations = async (scanId?: string) => {
  try {
    const url = scanId ? `/violations?scanId=${scanId}` : '/violations';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch violations:', error);
    throw error;
  }
};

// Fetch compliance scores
export const fetchComplianceScores = async (scanId?: string) => {
  try {
    const url = scanId ? `/compliance?scanId=${scanId}` : '/compliance';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch compliance scores:', error);
    throw error;
  }
};

// Fetch infrastructure topology
export const fetchInfrastructureTopology = async (scanId: string) => {
  try {
    const response = await apiClient.get(`/infrastructure/topology/${scanId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch topology:', error);
    throw error;
  }
};

export const dashboardAPI = {
  fetchDashboardSummary,
  fetchViolations,
  fetchComplianceScores,
  fetchInfrastructureTopology,
};
```

**File: `src/services/scanAPI.ts`**
```typescript
import apiClient from './apiClient';

export interface ScanResponse {
  scanId: string;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  progress: number;
}

// Upload file for scanning
export const uploadScanFile = async (file: File): Promise<ScanResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/scan/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to upload scan file:', error);
    throw error;
  }
};

// Get scan status
export const getScanStatus = async (scanId: string): Promise<ScanResponse> => {
  try {
    const response = await apiClient.get(`/scan/${scanId}/status`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch scan status:', error);
    throw error;
  }
};

// Get scan results
export const getScanResults = async (scanId: string) => {
  try {
    const response = await apiClient.get(`/scan/${scanId}/results`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch scan results:', error);
    throw error;
  }
};

export const scanAPI = {
  uploadScanFile,
  getScanStatus,
  getScanResults,
};
```

**File: `src/services/remediationAPI.ts`**
```typescript
import apiClient from './apiClient';

export interface RemediationResponse {
  actionId: string;
  status: 'pending' | 'applied' | 'failed';
  fixedViolations: string[];
  iacCode: string;
  timestamp: string;
}

// Trigger auto-fix
export const triggerAutoFix = async (
  scanId: string,
  violationIds?: string[]
): Promise<RemediationResponse> => {
  try {
    const response = await apiClient.post('/remediation/auto-fix', {
      scanId,
      violationIds,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to trigger auto-fix:', error);
    throw error;
  }
};

// Get remediation status
export const getRemediationStatus = async (
  actionId: string
): Promise<RemediationResponse> => {
  try {
    const response = await apiClient.get(`/remediation/${actionId}/status`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch remediation status:', error);
    throw error;
  }
};

// Get generated IaC code
export const getIaCCode = async (actionId: string): Promise<string> => {
  try {
    const response = await apiClient.get(`/remediation/${actionId}/iac`);
    return response.data.code;
  } catch (error) {
    console.error('Failed to fetch IaC code:', error);
    throw error;
  }
};

export const remediationAPI = {
  triggerAutoFix,
  getRemediationStatus,
  getIaCCode,
};
```

**File: `src/services/chatAPI.ts`**
```typescript
import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  context?: any;
}

// Send chat message
export const sendChatMessage = async (
  message: string,
  scanId: string,
  context?: any
): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post('/chat/message', {
      message,
      scanId,
      context,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
};

// Get chat history
export const getChatHistory = async (scanId: string): Promise<ChatMessage[]> => {
  try {
    const response = await apiClient.get(`/chat/history/${scanId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    throw error;
  }
};

// Clear chat
export const clearChat = async (scanId: string): Promise<void> => {
  try {
    await apiClient.delete(`/chat/history/${scanId}`);
  } catch (error) {
    console.error('Failed to clear chat:', error);
    throw error;
  }
};

export const chatAPI = {
  sendChatMessage,
  getChatHistory,
  clearChat,
};
```

---

## 🏪 Step 5: Create Store for State Management (Zustand)

**File: `src/store/dashboardStore.ts`**
```typescript
import { create } from 'zustand';
import { Violation, ComplianceScore } from '../services/dashboardAPI';

interface DashboardState {
  // State
  securityScore: number;
  violations: Violation[];
  compliance: ComplianceScore[];
  fixedViolations: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSecurityScore: (score: number) => void;
  setViolations: (violations: Violation[]) => void;
  setCompliance: (compliance: ComplianceScore[]) => void;
  addFixedViolation: (violationId: string) => void;
  addFixedViolations: (violationIds: string[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  securityScore: 0,
  violations: [],
  compliance: [],
  fixedViolations: [],
  isLoading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  setSecurityScore: (score) => set({ securityScore: score }),

  setViolations: (violations) => set({ violations }),

  setCompliance: (compliance) => set({ compliance }),

  addFixedViolation: (violationId) =>
    set((state) => ({
      fixedViolations: [...state.fixedViolations, violationId],
    })),

  addFixedViolations: (violationIds) =>
    set((state) => ({
      fixedViolations: [...state.fixedViolations, ...violationIds],
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
```

---

## 🪝 Step 6: Create Custom Hooks

**File: `src/hooks/useDashboardData.ts`**
```typescript
import { useEffect } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';
import { useDashboardStore } from '../store/dashboardStore';

export function useDashboardData() {
  const {
    securityScore,
    violations,
    compliance,
    isLoading,
    error,
    setSecurityScore,
    setViolations,
    setCompliance,
    setIsLoading,
    setError,
  } = useDashboardStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await dashboardAPI.fetchDashboardSummary();
        setSecurityScore(data.score);
        setViolations(data.violations);
        setCompliance(data.compliance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return {
    securityScore,
    violations,
    compliance,
    isLoading,
    error,
  };
}
```

**File: `src/hooks/useFileUpload.ts`**
```typescript
import { useState, useCallback } from 'react';
import { scanAPI } from '../services/scanAPI';

export function useFileUpload() {
  const [scanId, setScanId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await scanAPI.uploadScanFile(file);
      setScanId(response.scanId);
      return response.scanId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const pollScanStatus = useCallback(async (id: string, maxAttempts = 60) => {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await scanAPI.getScanStatus(id);

          if (status.status === 'complete') {
            clearInterval(pollInterval);
            resolve(status);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error('Scan failed'));
          }

          setUploadProgress(status.progress);
          attempts++;

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            reject(new Error('Scan timeout'));
          }
        } catch (err) {
          clearInterval(pollInterval);
          reject(err);
        }
      }, 1000); // Poll every 1 second
    });
  }, []);

  return {
    scanId,
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    pollScanStatus,
  };
}
```

---

## 🔄 Step 7: Update DashboardLayout Component

**File: `src/app/layouts/DashboardLayout.tsx`** (Updated)
```typescript
import { NavLink, Outlet, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  Activity, Shield, AlertTriangle, Brain, Wrench, Percent, Cpu,
  Link, MessageSquare, Radar, FileText, LogOut,
} from "lucide-react";
import { UploadZone } from "../components/UploadZone";
import { LoadingScreen } from "../components/LoadingScreen";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useFileUpload } from "../../hooks/useFileUpload";

export type DashboardContextType = {
  securityScore: number;
  fixedViolations: string[];
  handleAutoFix: () => void;
};

export function DashboardLayout() {
  const navigate = useNavigate();
  
  // Load dashboard data from API
  const { securityScore, violations, isLoading, error } = useDashboardData();
  
  // Handle file uploads
  const { uploadFile, pollScanStatus, uploadProgress } = useFileUpload();
  
  // Local state for remediation
  const [fixedViolations, setFixedViolations] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading && securityScore === 0) {
    return <LoadingScreen currentStep={0} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const scanId = await uploadFile(file);
      // Poll for completion
      await pollScanStatus(scanId);
      // Refresh dashboard data
      window.location.reload(); // Or use a callback to refresh
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoFix = async () => {
    // This will be called from child components
    // Trigger remediation API here
  };

  const links = [
    { to: "/dashboard/graph", icon: Activity, label: "Network Graph" },
    { to: "/dashboard/score", icon: Shield, label: "Security Score" },
    { to: "/dashboard/violations", icon: AlertTriangle, label: "Violations" },
    { to: "/dashboard/ai-opinion", icon: Brain, label: "AI Insights" },
    { to: "/dashboard/auto-fix", icon: Wrench, label: "Auto Fix" },
    { to: "/dashboard/confidence", icon: Percent, label: "Confidence" },
    { to: "/dashboard/quantum", icon: Cpu, label: "Quantum Scan" },
    { to: "/dashboard/supply-chain", icon: Link, label: "Supply Chain" },
    { to: "/dashboard/chat", icon: MessageSquare, label: "AI Chat" },
    { to: "/dashboard/compliance", icon: Radar, label: "Compliance" },
    { to: "/dashboard/report", icon: FileText, label: "Executive Report" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-72 bg-white/90 backdrop-blur-xl border-r border-gray-200 shadow-xl flex flex-col z-50"
      >
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Quantum ARES</h1>
          </div>
        </div>

        <div className="px-4 mb-6">
          <UploadZone onUpload={handleUpload} />
        </div>

        {isUploading && (
          <div className="px-6 my-4">
            <p className="text-sm text-gray-600 mb-2">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet
            context={{
              securityScore,
              fixedViolations,
              handleAutoFix,
            } as DashboardContextType}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Step 8: Update Component to Use Real Data

**File: `src/app/components/ViolationPanel.tsx`** (Updated)
```typescript
import { motion } from "motion/react";
import { AlertTriangle, Shield, CheckCircle, XCircle, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardAPI, Violation } from "../../services/dashboardAPI";

interface ViolationPanelProps {
  fixedViolations?: string[];
}

export function ViolationPanel({ fixedViolations = [] }: ViolationPanelProps) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch violations from API
  useEffect(() => {
    const loadViolations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardAPI.fetchViolations();
        setViolations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load violations');
      } finally {
        setLoading(false);
      }
    };

    loadViolations();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading violations...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const filteredViolations = violations.filter(v => {
    if (filter === 'all') return true;
    return v.severity === filter;
  });

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700 border-red-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      low: "bg-blue-100 text-blue-700 border-blue-300",
    };
    return colors[severity] || colors.low;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-gray-800 font-semibold">Active Violations</h3>
          </div>
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
              <button
                key={severity}
                onClick={() => setFilter(severity)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  filter === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {filteredViolations.map((violation) => (
          <motion.div
            key={violation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-2 ${getSeverityColor(violation.severity)}`}
          >
            <div className="flex items-start gap-3">
              {fixedViolations.includes(violation.id) ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{violation.title}</h4>
                <p className="text-sm opacity-75 mt-1">{violation.description}</p>
                <p className="text-xs mt-2">Resource: {violation.resource}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(violation.severity)}`}>
                {violation.severity.toUpperCase()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

---

## 🧪 Step 9: Testing the Integration

**File: `src/services/__tests__/dashboardAPI.test.ts`**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient from '../apiClient';
import { fetchDashboardSummary, fetchViolations } from '../dashboardAPI';

// Mock axios
vi.mock('../apiClient');

describe('dashboardAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard summary', async () => {
    const mockData = {
      score: 78,
      fixedViolations: ['1', '2'],
      violations: [],
      compliance: [],
      lastUpdate: new Date().toISOString(),
    };

    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await fetchDashboardSummary();
    expect(result.score).toBe(78);
    expect(result.fixedViolations).toEqual(['1', '2']);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network error');
    (apiClient.get as any).mockRejectedValue(error);

    await expect(fetchDashboardSummary()).rejects.toThrow('Network error');
  });

  it('should fetch violations', async () => {
    const mockViolations = [
      {
        id: '1',
        title: 'Test Violation',
        severity: 'critical',
        resource: 'test',
        description: 'Test',
        fixed: false,
      },
    ];

    (apiClient.get as any).mockResolvedValue({ data: mockViolations });

    const result = await fetchViolations();
    expect(result).toHaveLength(1);
  });
});
```

---

## 📋 Step 10: Backend API Requirements

**Node.js Express Example:**

```typescript
// routes/dashboard.ts
import express from 'express';
import { authMiddleware } from './middleware/auth';
import db from '../db';

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get latest scan
    const scan = await db.query(
      'SELECT * FROM scans WHERE user_id = ? ORDER BY upload_date DESC LIMIT 1',
      [userId]
    );

    if (!scan.length) {
      return res.json({
        score: 0,
        fixedViolations: [],
        violations: [],
        compliance: [],
      });
    }

    const scanId = scan[0].scan_id;

    // Get violations
    const violations = await db.query(
      'SELECT * FROM violations WHERE scan_id = ?',
      [scanId]
    );

    // Get compliance
    const compliance = await db.query(
      'SELECT * FROM compliance_scores WHERE scan_id = ?',
      [scanId]
    );

    // Get fixed violations
    const fixedViolations = violations
      .filter((v: any) => v.fixed)
      .map((v: any) => v.violation_id);

    res.json({
      score: scan[0].security_score,
      fixedViolations,
      violations,
      compliance,
      lastUpdate: scan[0].analyzed_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// POST /api/scan/upload
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.id;

    // Save file
    const filePath = `/uploads/${Date.now()}-${file.originalname}`;

    // Create scan record
    const result = await db.query(
      'INSERT INTO scans (user_id, file_name, status) VALUES (?, ?, ?)',
      [userId, file.originalname, 'pending']
    );

    const scanId = result.insertId;

    // Queue analysis job
    await queueAnalysisJob(scanId, filePath);

    res.json({ scanId });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
```

---

## 🎯 Final Checklist

- [ ] Install dependencies: `npm install axios @tanstack/react-query zustand`
- [ ] Create `.env.local` with `VITE_API_BASE_URL`
- [ ] Create `src/services/apiClient.ts`
- [ ] Create `src/services/dashboardAPI.ts`
- [ ] Create `src/services/scanAPI.ts`
- [ ] Create `src/services/remediationAPI.ts`
- [ ] Create `src/services/chatAPI.ts`
- [ ] Create `src/store/dashboardStore.ts`
- [ ] Create `src/hooks/useDashboardData.ts`
- [ ] Create `src/hooks/useFileUpload.ts`
- [ ] Update `DashboardLayout.tsx`
- [ ] Update component files (ViolationPanel, etc.)
- [ ] Create backend API endpoints
- [ ] Setup database
- [ ] Test all integrations
- [ ] Add error handling
- [ ] Add loading states
- [ ] Implement authentication
- [ ] Setup CORS
- [ ] Deploy to production

---

**Ready to integrate!** Follow the implementation guide above step-by-step. Start with Step 1-3 for basic setup, then proceed with backend API development in parallel.
