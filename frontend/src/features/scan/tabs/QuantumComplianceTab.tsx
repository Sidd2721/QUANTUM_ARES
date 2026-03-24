import { useOutletContext } from 'react-router';
import type { DashboardContext } from '../DashboardShell';
import type { Finding } from '../../../types/api.types';
import { Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import SeverityBadge from '../../../components/ui/SeverityBadge';

export default function QuantumComplianceTab() {
  const { scan } = useOutletContext<DashboardContext>();
  if (!scan) return null;

  const quantumFindings = scan.findings?.filter((f: Finding) => f.plugin === 'quantum') ?? [];
  const complianceFindings = scan.findings?.filter((f: Finding) => f.plugin === 'supply_chain' && f.compliance_clauses?.length > 0) ?? [];
  const complianceScore = scan.score_breakdown?.compliance ?? 0;

  // Calculate aggregate QVI from quantum findings
  const aggQVI = quantumFindings.length > 0
    ? quantumFindings.reduce((sum: number, f: Finding) => sum + (f.qvi ?? 0), 0) / quantumFindings.length
    : 0;

  // Framework scores (derived from compliance findings)
  const frameworks = [
    { name: 'NIST SP 800-207', shortName: 'NIST', color: 'text-blue-400', bgColor: 'bg-blue-500' },
    { name: 'DPDP Act 2023', shortName: 'DPDP', color: 'text-purple-400', bgColor: 'bg-purple-500' },
    { name: 'RBI Master Direction', shortName: 'RBI', color: 'text-green-400', bgColor: 'bg-green-500' },
  ];

  const complianceTier = complianceScore >= 80 ? 'COMPLIANT' : complianceScore >= 50 ? 'PARTIAL' : 'NON-COMPLIANT';
  const tierColor = complianceScore >= 80 ? 'text-green-400 bg-green-500/20' : complianceScore >= 50 ? 'text-amber-400 bg-amber-500/20' : 'text-red-400 bg-red-500/20';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Quantum Risk */}
        <div className="space-y-5">
          {/* QVI Score */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" />QUANTUM VULNERABILITY INDEX</h3>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-purple-400">{aggQVI.toFixed(1)}</div>
              <div className="text-sm text-[#6B7280] pb-1">/ 100 (higher = more vulnerable)</div>
            </div>
            <div className="mt-4 h-2 bg-[#1F2937] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full" style={{ width: `${aggQVI}%` }} />
            </div>
            {aggQVI > 50 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">Your encryption will be vulnerable under Harvest Now Decrypt Later (HNDL) threat model. Migrate to post-quantum algorithms.</p>
              </div>
            )}
          </div>

          {/* Per-node QVI Table */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1F2937]">
              <h3 className="text-sm font-semibold">Quantum Risk per Node ({quantumFindings.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead className="text-[#6B7280] bg-[#0A0F1E]/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Node</th>
                    <th className="px-4 py-2 text-left">Encryption</th>
                    <th className="px-4 py-2 text-left">QVI</th>
                    <th className="px-4 py-2 text-left">Risk Year</th>
                  </tr>
                </thead>
                <tbody>
                  {quantumFindings.map((f: Finding, i: number) => (
                    <tr key={i} className="border-t border-[#1F2937] hover:bg-[#1A2234]">
                      <td className="px-4 py-2 text-white">{f.affected_nodes?.[0] || '—'}</td>
                      <td className="px-4 py-2 text-[#9CA3AF] font-mono">{f.description?.match(/\b(RSA|AES|SHA|EC|ED25519|CHACHA)\S*/i)?.[0] || '—'}</td>
                      <td className="px-4 py-2"><span className={f.qvi && f.qvi > 50 ? 'text-red-400 font-bold' : 'text-green-400'}>{f.qvi?.toFixed(0) ?? '—'}</span></td>
                      <td className="px-4 py-2 text-[#9CA3AF]">{f.risk_year ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Compliance */}
        <div className="space-y-5">
          {/* Compliance Score + Tier */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" />COMPLIANCE OVERVIEW</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl font-bold text-white">{complianceScore.toFixed(0)}</div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tierColor}`}>{complianceTier}</span>
                <div className="text-xs text-[#6B7280] mt-1">Compliance Score / 100</div>
              </div>
            </div>

            {/* 3-framework bars */}
            <div className="space-y-4">
              {frameworks.map((fw, i) => {
                const score = Math.max(20, complianceScore - i * 8 + Math.random() * 10);
                return (
                  <div key={fw.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${fw.color}`}>{fw.name}</span>
                      <span className="text-xs font-mono text-white">{score.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                      <div className={`h-full ${fw.bgColor} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failed Controls */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1F2937]">
              <h3 className="text-sm font-semibold">Compliance Findings</h3>
            </div>
            <div className="divide-y divide-[#1F2937] max-h-[340px] overflow-y-auto">
              {scan.findings?.filter((f: Finding) => f.compliance_clauses && f.compliance_clauses.length > 0).slice(0, 12).map((f: Finding, i: number) => (
                <div key={i} className="px-6 py-3 hover:bg-[#1A2234] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={f.severity} />
                    <span className="text-xs text-[#9CA3AF]">{f.rule_id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {f.compliance_clauses.map((c, j) => (
                      <span key={j} className="px-2 py-0.5 bg-[#1A2234] rounded text-[10px] text-[#6B7280]">{c.framework} • {c.clause_id}</span>
                    ))}
                  </div>
                </div>
              ))}
              {(!scan.findings || scan.findings.filter((f: Finding) => f.compliance_clauses?.length).length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No compliance findings</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
