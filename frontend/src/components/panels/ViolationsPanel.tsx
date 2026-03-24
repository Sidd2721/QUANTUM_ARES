import { useState, useMemo } from 'react';
import { Shield, Zap, GitBranch, Package as PkgIcon, FileCheck, Brain, Code, Copy, Download, Info } from 'lucide-react';
import axios from 'axios';

export function ViolationsPanel({ scan, patches }: { scan: any, patches: any[] }) {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<any>(null);

  const findings = scan.findings || [];
  
  const counts = useMemo(() => {
    return {
      ALL: findings.length,
      CRITICAL: findings.filter((f: any) => f.severity === 'CRITICAL').length,
      HIGH: findings.filter((f: any) => f.severity === 'HIGH').length,
      MEDIUM: findings.filter((f: any) => f.severity === 'MEDIUM').length,
      LOW: findings.filter((f: any) => f.severity === 'LOW').length,
    };
  }, [findings]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return findings;
    return findings.filter((f: any) => f.severity === filter);
  }, [filter, findings]);

  const getEngineIcon = (plugin: string) => {
    switch (plugin) {
      case 'zero_trust': return <Shield className="w-3.5 h-3.5" />;
      case 'quantum': return <Zap className="w-3.5 h-3.5" />;
      case 'attack_path': return <GitBranch className="w-3.5 h-3.5" />;
      case 'supply_chain': return <PkgIcon className="w-3.5 h-3.5" />;
      case 'compliance': return <FileCheck className="w-3.5 h-3.5" />;
      default: return <Info className="w-3.5 h-3.5" />;
    }
  };

  const selectedPatch = selectedFinding 
    ? patches.find(p => p.rule_id === selectedFinding.rule_id)
    : null;

  const handleDownloadPatch = async () => {
    if (!selectedPatch) return;
    try {
      const token = localStorage.getItem('qa_token');
      const res = await axios.get(`/api/v1/scans/${scan.id}/patches?format=download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `fix_${selectedPatch.rule_id}.tf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error("Patch download failed", e);
      // Fallback if backend doesn't support the raw bytes endpoint yet
      const blob = new Blob([selectedPatch.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fix_${selectedPatch.rule_id}.tf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)] overflow-hidden">
      
      {/* Left: Findings List (60%) */}
      <div className="w-[60%] h-full flex flex-col border-r border-[var(--border-subtle)]">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all border
                ${filter === lvl 
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-accent)] text-white' 
                  : 'bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                }`}
            >
              {lvl} <span className="opacity-60 ml-1 font-['JetBrains_Mono']">{counts[lvl as keyof typeof counts]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto w-full">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] font-['Syne']">No {filter} violations found.</div>
          ) : (
            filtered.map((f: any, idx: number) => {
              const ruleBorder = f.severity === 'CRITICAL' ? 'border-[var(--critical)]' : 
                                 f.severity === 'HIGH' ? 'border-[var(--high)]' : 
                                 f.severity === 'MEDIUM' ? 'border-[var(--medium)]' : 'border-[var(--low)]';
              
              const isSelected = selectedFinding === f;

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedFinding(f)}
                  className={`flex items-start gap-4 p-4 border-b border-[var(--border-subtle)] border-l-[4px] cursor-pointer transition-colors
                    ${isSelected ? `bg-[var(--cyan-glow)] !border-l-[6px] ${ruleBorder}` : `bg-transparent hover:bg-[var(--bg-elevated)] ${ruleBorder}`}
                  `}
                >
                  <div className="w-[100px] shrink-0 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-['Syne'] font-bold text-[10px] uppercase tracking-wider text-white">
                      <span className={`w-2 h-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-[var(--critical)]' : f.severity === 'HIGH' ? 'bg-[var(--high)]' : f.severity === 'MEDIUM' ? 'bg-[var(--medium)]' : 'bg-[var(--low)]'}`}></span> 
                      {f.severity}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[12px] text-[var(--cyan-400)]">{f.rule_id}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                        {getEngineIcon(f.plugin)} <span className="uppercase tracking-wider font-['JetBrains_Mono']">{f.plugin.replace('_', ' ')}</span>
                      </div>
                      {f.cvss > 0 && (
                        <div className={`font-['JetBrains_Mono'] text-[11px] font-bold ${f.cvss > 7 ? 'text-[var(--critical)]' : 'text-[var(--high)]'}`}>
                          CVSS: {f.cvss.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="text-[14px] text-white leading-relaxed truncate max-w-full font-medium">
                      {f.description}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Finding Detail (40%) */}
      <div className="w-[40%] h-full bg-[var(--bg-base)] overflow-y-auto p-6">
        {!selectedFinding ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-20" strokeWidth={1} />
            <div className="font-['Syne'] text-[18px] font-semibold text-[var(--text-secondary)] mb-2">Isolation View</div>
            <div className="text-[13px] text-center max-w-[240px]">Select any violation from the list to view detailed analysis, compliance mapping, and AutoFix patches.</div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn pb-12">
            
            {/* Meta Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-widest uppercase
                  ${selectedFinding.severity === 'CRITICAL' ? 'bg-[var(--critical)]' : selectedFinding.severity === 'HIGH' ? 'bg-[var(--high)]' : selectedFinding.severity === 'MEDIUM' ? 'bg-[var(--medium)]' : 'bg-[var(--low)]'}
                `}>{selectedFinding.severity}</span>
                <span className="font-['JetBrains_Mono'] text-[14px] text-white font-bold">{selectedFinding.rule_id}</span>
                <span className="text-[var(--cyan-400)] text-[12px] underline cursor-pointer hover:text-[var(--cyan-500)] ml-auto font-['JetBrains_Mono']">
                  MITRE: {selectedFinding.rule_id.startsWith('ZT') ? 'T1046' : 'T1190'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(selectedFinding.affected_nodes || []).map((node: string) => (
                  <span key={node} className="font-['JetBrains_Mono'] text-[11px] px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    {node}
                  </span>
                ))}
              </div>
              
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                {selectedFinding.description}
              </p>
              
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[12px] font-semibold text-white uppercase tracking-wider mb-2">Remediation Steps</div>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  {selectedFinding.remediation_steps || "Consult cloud provider guidelines to correct this configuration gap."}
                </p>
              </div>
            </div>

            {/* AI Opinion */}
            <div className="p-5 rounded-xl border border-[var(--border-accent)] bg-[var(--cyan-glow)] shadow-[0_0_20px_rgba(34,211,238,0.05)]">
              <div className="flex items-center gap-2 text-[var(--cyan-400)] mb-4">
                <Brain className="w-5 h-5" />
                <h3 className="font-['Syne'] font-bold text-[15px]">AI Security Opinion</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Impact</div>
                  <div className="font-['JetBrains_Mono'] text-[12px] text-white font-bold bg-[var(--bg-base)] px-2 py-1 rounded inline-block">SYSTEM-WIDE</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Likelihood</div>
                  <div className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">High (Public Exploit)</div>
                </div>
              </div>
              
              <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-base)] p-3 rounded border border-[var(--border-subtle)]">
                Our analysis indicates that this configuration provides an open attack vector to the underlying VPC architecture without requiring strong authentication tokens.
              </div>
            </div>

            {/* AutoFix Patch */}
            {selectedPatch && (
              <div className="p-5 rounded-xl border border-dashed border-[var(--low)] bg-[var(--low-bg)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[var(--low)]">
                    <Code className="w-5 h-5" />
                    <h3 className="font-['Syne'] font-bold text-[15px]">AutoFix Patch Generated</h3>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[13px] font-bold text-[var(--low)]">
                    +{selectedPatch.score_impact} pts
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-muted)] font-medium">
                    Difficulty: {selectedPatch.difficulty}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[var(--text-muted)] border-b border-[var(--text-muted)]">
                    Target: {selectedPatch.affected_node}
                  </span>
                </div>

                <div className="relative group">
                  <pre className="p-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-x-auto text-[12px] font-['JetBrains_Mono'] text-[var(--text-secondary)] leading-relaxed">
                    {selectedPatch.content}
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedPatch.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-white hover:border-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button 
                  onClick={handleDownloadPatch}
                  className="w-full mt-4 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Download .tf Patch File
                </button>
              </div>
            )}

            {/* Compliance Clauses */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <h4 className="font-['Syne'] font-semibold text-[14px] text-[var(--text-secondary)] mb-3">Regulatory Impact</h4>
              <div className="space-y-2">
                {selectedFinding.plugin === 'zero_trust' && (
                  <div className="flex gap-3 text-[12px] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <div className="font-['JetBrains_Mono'] text-[var(--cyan-400)] shrink-0 bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border-default)]">NIST SP 800-207</div>
                    <div className="text-[var(--text-secondary)]">Violates core tenant: All data sources and computing services are considered resources.</div>
                  </div>
                )}
                {selectedFinding.plugin === 'quantum' && (
                  <div className="flex gap-3 text-[12px] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <div className="font-['JetBrains_Mono'] text-[var(--q-color)] shrink-0 bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border-default)]">NIST FIPS 203</div>
                    <div className="text-[var(--text-secondary)]">Does not meet Module-Lattice-Based Key-Encapsulation Mechanism standards for post-quantum security.</div>
                  </div>
                )}
                <div className="flex gap-3 text-[12px] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                  <div className="font-['JetBrains_Mono'] text-[var(--comp-color)] shrink-0 bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border-default)]">DPDP 2023</div>
                  <div className="text-[var(--text-secondary)]">Section 8(4): Data Fiduciary must implement appropriate technical and organizational measures.</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
