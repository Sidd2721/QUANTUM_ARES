import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import type { DashboardContext } from '../DashboardShell';
import type { Patch, Finding } from '../../../types/api.types';
import { Wrench, Download, Copy, Check, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { scanService } from '../../../services/scan.service';
import SeverityBadge from '../../../components/ui/SeverityBadge';
import CodeBlock from '../../../components/ui/CodeBlock';

export default function RemediationTab() {
  const { scan, scanId } = useOutletContext<DashboardContext>();
  const [selectedPatch, setSelectedPatch] = useState<number>(0);
  const [opinions, setOpinions] = useState<any[]>([]);
  const [expandedOpinion, setExpandedOpinion] = useState<number | null>(null);

  useEffect(() => {
    if (scanId) {
      scanService.getOpinion(scanId).then(data => setOpinions(data?.opinions ?? data ?? [])).catch(() => {});
    }
  }, [scanId]);

  if (!scan) return null;
  const patches: Patch[] = scan.auto_fix_patches ?? [];
  const totalImpact = patches.reduce((s, p) => s + parseInt(String(p.score_impact).replace(/[^0-9-]/g, '') || '0'), 0);
  const current = patches[selectedPatch];

  const getCode = (p: Patch) => p.terraform?.content || p.kubernetes?.content || p.iam?.content || '# No code available';
  const getLang = (p: Patch) => p.terraform ? 'terraform' : p.kubernetes ? 'yaml' : 'json';
  const getFile = (p: Patch) => p.terraform?.file || p.kubernetes?.file || p.iam?.file || 'patch';

  const criticalFindings = scan.findings?.filter((f: Finding) => f.severity === 'CRITICAL' && f.ai_opinion) ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Impact Counter */}
      {totalImpact > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
          <Wrench className="w-5 h-5 text-green-400" />
          <p className="text-sm"><span className="font-bold text-green-400">+{totalImpact} pts</span> <span className="text-[#9CA3AF]">potential score improvement from {patches.length} patches</span></p>
        </div>
      )}

      {/* Patches + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Patch List (40%) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1F2937]">
            <h3 className="text-sm font-semibold">IaC Patches ({patches.length})</h3>
          </div>
          <div className="divide-y divide-[#1F2937] max-h-[500px] overflow-y-auto">
            {patches.map((p, i) => (
              <button key={i} onClick={() => setSelectedPatch(i)}
                className={`w-full text-left px-6 py-4 transition-all ${selectedPatch === i ? 'bg-blue-500/10 border-l-2 border-blue-400' : 'hover:bg-[#1A2234] border-l-2 border-transparent'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-blue-400">{p.rule_id}</span>
                  <span className="text-xs font-bold text-green-400">{p.score_impact}</span>
                </div>
                <p className="text-sm text-white mb-1">{p.title}</p>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={p.severity} />
                  <span className="px-2 py-0.5 bg-[#1A2234] rounded text-[10px] text-[#6B7280]">{getLang(p).toUpperCase()}</span>
                  <span className="px-2 py-0.5 bg-[#1A2234] rounded text-[10px] text-[#6B7280]">{p.difficulty}</span>
                </div>
              </button>
            ))}
            {patches.length === 0 && <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No patches generated</div>}
          </div>
        </div>

        {/* Code Viewer (60%) */}
        <div className="lg:col-span-3">
          {current ? (
            <CodeBlock code={getCode(current)} language={getLang(current)} filename={getFile(current)} title={current.title} />
          ) : (
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center text-[#6B7280]">Select a patch to view code</div>
          )}
        </div>
      </div>

      {/* AI Opinion Panel */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1F2937]">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" />AI Security Opinions</h3>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {criticalFindings.slice(0, 8).map((f: Finding, i: number) => (
            <div key={i} className="hover:bg-[#1A2234] transition-colors">
              <button onClick={() => setExpandedOpinion(expandedOpinion === i ? null : i)} className="w-full text-left px-6 py-4 flex items-center gap-3">
                {expandedOpinion === i ? <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-mono text-xs text-blue-400">{f.rule_id}</span>
                    <span className="text-xs text-[#9CA3AF] truncate">{f.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px]">{f.ai_opinion?.impact}</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px]">{f.ai_opinion?.priority}</span>
                </div>
              </button>
              {expandedOpinion === i && f.ai_opinion && (
                <div className="px-6 pb-4 pl-12 animate-fadeIn">
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{f.ai_opinion.reason}</p>
                  <p className="text-xs text-[#6B7280] mt-2">Likelihood: {f.ai_opinion.likelihood}</p>
                </div>
              )}
            </div>
          ))}
          {criticalFindings.length === 0 && <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No AI opinions available</div>}
        </div>
      </div>
    </div>
  );
}
