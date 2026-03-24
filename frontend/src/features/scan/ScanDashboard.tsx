import { NavLink, Outlet, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Activity,
  Shield,
  AlertTriangle,
  Brain,
  Wrench,
  Percent,
  Cpu,
  Link,
  MessageSquare,
  Radar,
  FileText,
  LogOut,
} from "lucide-react";
import { UploadZone } from "./UploadZone";
import { LoadingScreen } from "./LoadingScreen";
import { uploadScan, pollScanStatus, getScanResult } from "../../lib/api";

export type DashboardContextType = {
  scanId: string | null;
  scanData: any | null;
  securityScore: number;
  fixedViolations: string[];
  handleAutoFix: () => void;
};

export function ScanDashboard() {
  const navigate = useNavigate();
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanData, setScanData] = useState<any | null>(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [fixedViolations, setFixedViolations] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setLoadingStep(0);
    const interval = setInterval(() => setLoadingStep((p) => p < 4 ? p + 1 : p), 1000);

    try {
      const { scan_id } = await uploadScan(file);
      setScanId(scan_id);
      
      const status = await pollScanStatus(scan_id);
      if (status.status === 'complete') {
        const result = await getScanResult(scan_id);
        setScanData(result);
        setSecurityScore(result.security_index || 0);
      } else {
        alert("Scan failed: status " + status.status);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload architecture");
    } finally {
      clearInterval(interval);
      setLoadingStep(5);
      setTimeout(() => setIsUploading(false), 500);
    }
  };

  const handleAutoFix = () => {
    // Only a visual mock for the AutoFix layout callback, real hit happens inside AutoFixPanel
    setTimeout(() => {
      setSecurityScore(78);
      setFixedViolations(["1", "2", "4", "5", "6"]);
    }, 4000);
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
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-72 bg-white/90 backdrop-blur-xl border-r border-gray-200 shadow-xl flex flex-col z-50"
      >
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              QUANTUM-ARES
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                    isActive
                      ? "bg-blue-50/80 text-blue-600 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05),_0_2px_4px_rgba(59,130,246,0.1)] border border-blue-100"
                      : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100 hover:shadow-sm"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"}`} />
                    <span className="font-medium">{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100 bg-white/50">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-100 rounded-xl transition-all duration-300 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Exit Dashboard
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative" style={{ perspective: "1000px" }}>
        {isUploading ? <LoadingScreen currentStep={loadingStep} /> : null}

        {/* Header with Upload Zone */}
        <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40 p-6 px-8 lg:px-12">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Infrastructure Dashboard</h1>
              <p className="text-sm text-gray-500">View and manage security vulnerabilities</p>
            </div>
            <div className="w-80">
              <UploadZone onUpload={handleUpload} />
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full flex-1">
          <Outlet context={{ scanId, scanData, securityScore, fixedViolations, handleAutoFix } satisfies DashboardContextType} />
        </div>
      </main>
    </div>
  );
}
