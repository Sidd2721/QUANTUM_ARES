import { useState, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { Shield, Upload, BarChart3, Map, Zap, Wrench, FileText, Bell, User, X, Loader2 } from 'lucide-react';
import { useScan } from '../../hooks/useScan';
import { useAuth } from '../../hooks/useAuth';
import type { ScanResult } from '../../types/api.types';
import { scanService } from '../../services/scan.service';

const TABS = [
  { path: 'risk-overview',      label: 'Risk Overview',        icon: BarChart3 },
  { path: 'threat-map',         label: 'Threat Map',           icon: Map       },
  { path: 'quantum-compliance', label: 'Quantum & Compliance', icon: Zap       },
  { path: 'remediation',        label: 'Remediation',          icon: Wrench    },
  { path: 'reports-advisory',   label: 'Reports & Advisory',   icon: FileText  },
];

export default function DashboardShell() {
  const { logout } = useAuth();
  const { scan, scanId, isScanning, error: scanError, startScan, onScanComplete } = useScan();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setUploadError(''); }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const sid = await startScan(selectedFile);
      if (sid) {
        // Poll until complete
        const poll = async () => {
          try {
            const status = await scanService.getStatus(sid);
            if (status.status === 'complete' || status.status === 'failed') {
              const result = await scanService.getResult(sid);
              onScanComplete(result);
            } else {
              setTimeout(poll, 1500);
            }
          } catch { setTimeout(poll, 2000); }
        };
        poll();
      }
      setSelectedFile(null);
      navigate('/dashboard/risk-overview');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const scoreColor = scan?.security_index !== undefined
    ? scan.security_index >= 70 ? 'text-green-400' : scan.security_index >= 40 ? 'text-amber-400' : 'text-red-400'
    : 'text-[#6B7280]';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex flex-col">
      <header className="bg-[#0A0F1E] sticky top-0 z-40">
        {/* Top bar: Logo + Upload + Actions */}
        <div className="border-b border-[#1F2937]">
          <div className="max-w-screen-xl mx-auto px-6 py-3">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-sm tracking-wide">QUANTUM-ARES</span>
              </div>

              {/* Upload Zone */}
              <div className="flex-1 min-w-0">
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl px-5 py-3 transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-[#1F2937] hover:border-blue-500/40 hover:bg-blue-500/5'}`}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".json,.yaml,.yml,.tf" className="hidden" onChange={e => e.target.files?.[0] && (() => { setSelectedFile(e.target.files![0]); setUploadError(''); })()} />
                  {!selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0"><Upload className="w-4 h-4 text-blue-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Drop your infrastructure config here</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">JSON topology, YAML / Kubernetes, Terraform HCL</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} className="px-4 py-2 bg-[#1A2234] border border-[#1F2937] rounded-lg text-xs font-medium hover:border-blue-500/40 transition-all flex-shrink-0">Browse</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-green-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                        <p className="text-xs text-[#6B7280]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }} className="p-1 text-[#6B7280] hover:text-white"><X className="w-4 h-4" /></button>
                        <button onClick={e => { e.stopPropagation(); handleAnalyze(); }} disabled={isUploading}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-semibold transition-all shadow-[0_0_12px_rgba(59,130,246,0.3)] flex items-center gap-1.5">
                          {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing...</> : 'Analyze Infrastructure'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {(uploadError || scanError) && <p className="text-xs text-red-400 mt-1.5 px-1">{uploadError || scanError}</p>}
              </div>

              {/* Right: status + user */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isScanning && (
                  <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...
                  </div>
                )}
                {scan && !isScanning && (
                  <div className={`text-sm font-bold ${scoreColor}`}>
                    {scan.security_index?.toFixed(0)}<span className="text-xs font-normal text-[#6B7280]">/100</span>
                  </div>
                )}
                <button className="p-2 text-[#6B7280] hover:text-white hover:bg-[#1A2234] rounded-lg transition-all"><Bell className="w-4 h-4" /></button>
                <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-[#6B7280] hover:text-white hover:bg-[#1A2234] rounded-lg transition-all" title="Sign out"><User className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* TABS — separate row, perfectly aligned */}
        <div className="border-b border-[#1F2937] bg-[#0A0F1E]">
          <div className="max-w-screen-xl mx-auto px-6">
            <nav className="flex items-center gap-0 -mb-px">
              {TABS.map(tab => (
                <NavLink key={tab.path} to={`/dashboard/${tab.path}`}
                  className={({ isActive }) => `inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive ? 'text-blue-400 border-blue-400 bg-blue-500/5' : 'text-[#6B7280] border-transparent hover:text-[#D1D5DB] hover:border-[#374151]'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* SCAN STATUS BAR */}
        {scan && (
          <div className="bg-[#111827] border-b border-[#1F2937]">
            <div className="max-w-screen-xl mx-auto px-6 py-2 flex items-center gap-4 text-xs text-[#6B7280]">
              <span className="text-white font-medium">{scan.name}</span><span>•</span>
              <span>{scan.findings?.length ?? 0} findings</span><span>•</span>
              <span>Score: <span className={scoreColor + ' font-medium'}>{scan.security_index?.toFixed(0)}/100</span></span><span>•</span>
              <span>{scan.node_count} nodes</span><span>•</span>
              <span className={scan.executive_summary?.risk_level === 'CRITICAL' ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'}>{scan.executive_summary?.risk_level}</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto px-6 py-8 w-full">
        {!scan && !isScanning ? <EmptyState /> : isScanning ? <ScanningState /> : <Outlet context={{ scan, scanId }} />}
      </main>
    </div>
  );
}

export type DashboardContext = { scan: ScanResult; scanId: string | null };

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeIn">
      <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6"><Upload className="w-10 h-10 text-blue-400/50" /></div>
      <h2 className="text-xl font-semibold text-white mb-2">No assessment yet</h2>
      <p className="text-[#9CA3AF] max-w-sm leading-relaxed">Drop your infrastructure config file in the upload zone above to start your first security assessment.</p>
      <div className="mt-6 flex gap-2 text-xs text-[#6B7280]">
        {['JSON topology', 'YAML / Kubernetes', 'Terraform HCL'].map(f => <span key={f} className="px-2.5 py-1 bg-[#111827] border border-[#1F2937] rounded-full">{f}</span>)}
      </div>
    </div>
  );
}

function ScanningState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeIn">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-full h-full flex items-center justify-center bg-[#111827] border border-blue-500/30 rounded-2xl">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Analyzing infrastructure...</h2>
      <p className="text-[#9CA3AF] max-w-sm">Running 8-stage AI pipeline: parsing → graph → engines → AI opinion → autofix → signing</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-blue-400">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
