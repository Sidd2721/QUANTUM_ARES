import { useOutletContext } from 'react-router';
import type { DashboardContext } from '../DashboardShell';
import type { Finding } from '../../../types/api.types';
import { AlertTriangle, TrendingDown, Shield, Activity, Zap, GitBranch, Package, FileCheck } from 'lucide-react';
import ScoreRing from '../../../components/ui/ScoreRing';
import SeverityBadge from '../../../components/ui/SeverityBadge';

export default function RiskOverviewTab() {
  const { scan } = useOutletContext<DashboardContext>();
  if (!scan) return null;

  const { security_index, score_breakdown, executive_summary, findings, confidence_warnings } = scan;
  const criticalFindings = findings?.filter((f: Finding) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ?? [];

  const engines = [
    { key: 'zero_trust',   label: 'Zero Trust',   icon: Shield,    color: 'bg-blue-500' },
    { key: 'quantum',      label: 'Quantum',       icon: Zap,       color: 'bg-purple-500' },
    { key: 'attack_path',  label: 'Attack Path',   icon: GitBranch, color: 'bg-red-500' },
    { key: 'supply_chain', label: 'Supply Chain',   icon: Package,   color: 'bg-amber-500' },
    { key: 'compliance',   label: 'Compliance',     icon: FileCheck, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Confidence Warnings */}
      {confidence_warnings && confidence_warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">{confidence_warnings.length} Confidence Warning{confidence_warnings.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{confidence_warnings[0]?.reason}</p>
          </div>
        </div>
      )}

      {/* Top Row: Score Ring + Breakdown + Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score Ring */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center">
          <ScoreRing score={security_index} size={160} />
          <div className="mt-4 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${security_index >= 70 ? 'bg-green-500/20 text-green-400' : security_index >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
              {executive_summary?.risk_level || (security_index >= 70 ? 'LOW RISK' : security_index >= 40 ? 'MEDIUM RISK' : 'CRITICAL')}
            </span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4 text-[#9CA3AF]">ENGINE BREAKDOWN</h3>
          <div className="space-y-3">
            {engines.map(eng => {
              const val = (score_breakdown as any)?.[eng.key] ?? 0;
              return (
                <div key={eng.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-xs text-[#9CA3AF]"><eng.icon className="w-3.5 h-3.5" />{eng.label}</span>
                    <span className="text-xs font-mono text-white">{val.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className={`h-full ${eng.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(val, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4 text-[#9CA3AF]">EXECUTIVE SUMMARY</h3>
          {executive_summary && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-red-400">{executive_summary.critical_count}</div>
                <div className="text-xs text-[#6B7280]">Critical<br />Findings</div>
                <div className="text-3xl font-bold text-amber-400 ml-4">{executive_summary.attack_paths ?? 0}</div>
                <div className="text-xs text-[#6B7280]">Attack<br />Paths</div>
              </div>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{executive_summary.main_risk}</p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-400">Recommendation</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{executive_summary.primary_action}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Findings Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="text-sm font-semibold">Critical & High Findings ({criticalFindings.length})</h3>
          <TrendingDown className="w-4 h-4 text-red-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#6B7280] bg-[#0A0F1E]/50">
              <tr>
                <th className="px-6 py-3 text-left">Severity</th>
                <th className="px-6 py-3 text-left">Rule ID</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Engine</th>
                <th className="px-6 py-3 text-left">CVSS</th>
              </tr>
            </thead>
            <tbody>
              {criticalFindings.slice(0, 15).map((f: Finding, i: number) => (
                <tr key={i} className="border-t border-[#1F2937] hover:bg-[#1A2234] transition-colors group">
                  <td className="px-6 py-3"><SeverityBadge severity={f.severity} /></td>
                  <td className="px-6 py-3 font-mono text-xs text-blue-400">{f.rule_id}</td>
                  <td className="px-6 py-3 text-xs text-[#9CA3AF] max-w-md truncate">{f.description}</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 bg-[#1A2234] rounded text-xs text-[#9CA3AF]">{f.plugin || 'system'}</span></td>
                  <td className="px-6 py-3 font-mono text-xs">{f.cvss?.toFixed(1) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
