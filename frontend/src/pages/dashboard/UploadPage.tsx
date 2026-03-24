import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CloudUpload, Shield, Zap, GitBranch, Package as PkgIcon, FileCheck, CheckCircle2, XCircle, Loader2, Building2, Landmark, Library } from 'lucide-react';
import axios from 'axios';

export function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [scanId, setScanId] = useState('');
  const [progress, setProgress] = useState(0);
  const [engineStatus, setEngineStatus] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name.replace(/\.(json|yaml|tf)$/,''));
    form.append('evidence_source', 'manual'); 

    try {
      const res = await axios.post('/api/v1/validate', form, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('qa_token')}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      setScanId(res.data.scan_id);
      startPolling(res.data.scan_id);
    } catch (err: any) {
      console.error(err);
      setUploading(false);
      alert(err.response?.data?.detail || 'Upload failed');
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/v1/scans/${id}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('qa_token')}` }
        });
        setEngineStatus(data.engine_status || {});
        
        // Calculate progress (each completed engine is 20%)
        const engines = ['zero_trust', 'quantum', 'attack_path', 'supply_chain', 'compliance'];
        const completed = engines.filter(e => data.engine_status?.[e] === 'completed').length;
        setProgress((completed / engines.length) * 100);

        if (data.status === 'completed' || data.status === 'complete') {
          clearInterval(interval);
          setTimeout(() => navigate(`/dashboard/scan/${id}`), 500);
        }
        if (data.status === 'failed') {
          clearInterval(interval);
          setUploading(false);
          alert('Validation failed: The uploaded file could not be parsed or processed.');
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
  };

  const loadDemo = async (filename: string) => {
    try {
      const res = await fetch(`/demo/${filename}`);
      const blob = await res.blob();
      handleFile(new File([blob], filename, { type: 'application/json' }));
    } catch (err) {
      alert(`Failed to load demo scenario: ${filename}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-10">
      <h1 className="font-['Syne'] font-bold text-[28px] text-white mb-2">New Validation</h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8">Drop your infrastructure file to begin security assessment</p>

      {!uploading ? (
        <>
          <div 
            className={`w-full h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer bg-[var(--bg-surface)]
              ${isDragOver ? 'border-[var(--cyan-400)] bg-[var(--cyan-glow)]' : 'border-[var(--border-default)] hover:border-[var(--cyan-400)]/50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload className="w-12 h-12 text-[var(--text-muted)] mb-4" strokeWidth={1.5} />
            <div className="font-medium text-[18px] text-white mb-2">Drop your infrastructure config file here</div>
            <div className="text-[13px] text-[var(--text-muted)] mt-1">Supports JSON topology, Kubernetes YAML, Terraform HCL</div>
            <div className="mt-4 text-[13px] text-[var(--cyan-400)] underline underline-offset-4 decoration-[var(--cyan-400)]/30 hover:decoration-[var(--cyan-400)]">
              or click to browse
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          </div>

          <div className="mt-12">
            <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Or try a demo scenario:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => loadDemo('hospital.json')} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] transition-all">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] flex items-center justify-center text-[var(--cyan-400)] border border-[var(--border-subtle)]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-white">Hospital Demo</div>
                  <div className="text-[11px] text-[var(--text-muted)]">JSON Topology • 28 nodes</div>
                </div>
              </button>
              <button onClick={() => loadDemo('bank.json')} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] transition-all">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] flex items-center justify-center text-[var(--ap-color)] border border-[var(--border-subtle)]">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-white">Bank Demo</div>
                  <div className="text-[11px] text-[var(--text-muted)]">JSON Topology • 45 nodes</div>
                </div>
              </button>
              <button onClick={() => loadDemo('government.json')} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] transition-all">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] flex items-center justify-center text-[var(--q-color)] border border-[var(--border-subtle)]">
                  <Library className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-white">Government Demo</div>
                  <div className="text-[11px] text-[var(--text-muted)]">JSON Topology • 120 nodes</div>
                </div>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="font-['JetBrains_Mono'] text-[13px] text-[var(--text-muted)]">
              Session ID: <span className="text-[var(--text-primary)]">{scanId || 'INITIALIZING...'}</span>
            </div>
            <div className="font-['JetBrains_Mono'] text-[14px] text-[var(--cyan-400)] font-bold">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-[var(--cyan-500)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="space-y-4">
            <EngineRow name="Zero-Trust Engine" icon={<Shield className="w-4 h-4" />} status={engineStatus.zero_trust} />
            <EngineRow name="Quantum Risk Engine" icon={<Zap className="w-4 h-4" />} status={engineStatus.quantum} />
            <EngineRow name="Attack Path Engine" icon={<GitBranch className="w-4 h-4" />} status={engineStatus.attack_path} />
            <EngineRow name="Supply Chain Engine" icon={<PkgIcon className="w-4 h-4" />} status={engineStatus.supply_chain} />
            <EngineRow name="Compliance Engine" icon={<FileCheck className="w-4 h-4" />} status={engineStatus.compliance} />
          </div>
        </div>
      )}
    </div>
  );
}

function EngineRow({ name, icon, status }: { name: string, icon: React.ReactNode, status?: string }) {
  const getStatusDisplay = () => {
    switch(status) {
      case 'completed': return <Badge icon={<CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />} text="Analysis Complete" color="text-[var(--low)]" />;
      case 'failed':    return <Badge icon={<XCircle className="w-3.5 h-3.5" />} text="Failed" color="text-[var(--critical)]" />;
      case 'running':   return <Badge icon={<Loader2 className="w-3.5 h-3.5 animate-spin" />} text="Analyzing..." color="text-[var(--medium)]" />;
      case 'pending':
      default:          return <Badge text="Pending" color="text-[var(--text-muted)]" dot />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-3 text-[14px] text-white">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        {name}
      </div>
      <div>{getStatusDisplay()}</div>
    </div>
  );
}

function Badge({ icon, text, color, dot }: { icon?: React.ReactNode, text: string, color: string, dot?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-[12px] font-medium ${color}`}>
      {dot && <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] opacity-50"></span>}
      {icon}
      {text}
    </div>
  );
}
