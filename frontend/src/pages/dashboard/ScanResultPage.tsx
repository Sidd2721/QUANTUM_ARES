import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { BarChart3, Network, AlertTriangle, Zap, MessageSquare, FileText, Download } from 'lucide-react';
import axios from 'axios';
import { motion } from 'motion/react';

import { ScorePanel } from '../../components/panels/ScorePanel';
import { GraphPanel } from '../../components/panels/GraphPanel';
import { ViolationsPanel } from '../../components/panels/ViolationsPanel';
import { QuantumRiskPanel } from '../../components/panels/QuantumRiskPanel';
import { ChatPanel } from '../../components/panels/ChatPanel';
import { ReportPanel } from '../../components/panels/ReportPanel';

export function ScanResultPage() {
  const { scanId } = useParams();
  const [activeTab, setActiveTab] = useState('score');
  const [scan, setScan] = useState<any>(null);
  const [patches, setPatches] = useState<any[]>([]);

  useEffect(() => {
    if (!scanId) return;
    const token = localStorage.getItem('qa_token');
    
    axios.get(`/api/v1/scans/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setScan(res.data)).catch(console.error);
    
    axios.get(`/api/v1/scans/${scanId}/patches`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setPatches(res.data.patches || [])).catch(console.error);

  }, [scanId]);

  if (!scan) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--cyan-400)] animate-spin mb-4"></div>
        <div className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-[13px]">LOADING_CONTEXT...</div>
      </div>
    );
  }

  const ex = scan.executive_summary;
  const score = scan.security_index;

  const scoreColorVar = score < 40 ? 'var(--score-critical)' : 
                        score < 60 ? 'var(--score-high)' : 
                        score < 80 ? 'var(--score-medium)' : 'var(--score-low)';

  const tabs = [
    { id: 'score',     icon: <BarChart3 className="w-4 h-4" />,      label: 'Score' },
    { id: 'graph',     icon: <Network className="w-4 h-4" />,        label: 'Graph' },
    { id: 'violations',icon: <AlertTriangle className="w-4 h-4" />,  label: 'Violations' },
    { id: 'quantum',   icon: <Zap className="w-4 h-4" />,            label: 'Quantum Risk' },
    { id: 'chat',      icon: <MessageSquare className="w-4 h-4" />,  label: 'AI Chat' },
    { id: 'report',    icon: <FileText className="w-4 h-4" />,       label: 'Report' }
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] text-[var(--text-primary)] relative">
      
      {/* Sticky Header (72px) */}
      <div className="sticky top-0 z-10 w-full h-[72px] bg-[var(--bg-surface)] backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 shrink-0">
        
        {/* Left: Metadata */}
        <div className="flex flex-col">
          <h2 className="font-['Syne'] font-semibold text-[20px] text-white tracking-tight">{scan.name || 'Validation Session'}</h2>
          <div className="font-['JetBrains_Mono'] text-[12px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
            <span>Entities: {scan.graph_json?.nodes?.length || 0}</span>
            <span>·</span>
            <span>Critical Faults: {ex?.critical_count || 0}</span>
            <span>·</span>
            <span className="opacity-60">ID: {scanId?.slice(0, 8)}</span>
          </div>
        </div>

        {/* Middle: Score Ring */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="w-[48px] h-[48px] relative flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
              <path stroke="var(--border-subtle)" strokeWidth="3" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path stroke={scoreColorVar} strokeWidth="3" fill="none" strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute font-['JetBrains_Mono'] font-bold text-[16px]" style={{ color: scoreColorVar }}>
              {Math.round(score)}
            </span>
          </div>
        </div>

        {/* Right: Action */}
        <button 
          onClick={() => setActiveTab('report')}
          className="h-[36px] px-4 rounded-lg bg-[var(--cyan-500)] text-black font-semibold text-[13px] flex items-center gap-2 hover:bg-[var(--cyan-400)] transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2.5} /> Download Report
        </button>

      </div>

      {/* Tab Bar Container */}
      <div className="w-full border-b border-[var(--border-subtle)] shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex px-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-[48px] px-4 flex items-center gap-2 text-[14px] font-medium transition-colors relative
                ${activeTab === tab.id 
                  ? 'text-[var(--cyan-400)]' 
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)]'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--cyan-400)] shadow-[0_-2px_8px_rgba(34,211,238,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Panels */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 overflow-y-auto w-full relative"
      >
        {activeTab === 'score' && <ScorePanel scan={scan} />}
        {activeTab === 'graph' && <GraphPanel scan={scan} />}
        {activeTab === 'violations' && <ViolationsPanel scan={scan} patches={patches} />}
        {activeTab === 'quantum' && <QuantumRiskPanel scan={scan} />}
        {activeTab === 'chat' && <ChatPanel scanId={scanId!} />}
        {activeTab === 'report' && <ReportPanel scan={scan} />}
      </motion.div>

    </div>
  );
}
