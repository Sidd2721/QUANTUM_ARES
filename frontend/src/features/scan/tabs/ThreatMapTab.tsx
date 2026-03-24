import { useState } from 'react';
import { useOutletContext } from 'react-router';
import type { DashboardContext } from '../DashboardShell';
import type { Finding, GraphNode } from '../../../types/api.types';
import { Network, Eye, X, AlertTriangle, Package } from 'lucide-react';
import SeverityBadge from '../../../components/ui/SeverityBadge';

export default function ThreatMapTab() {
  const { scan } = useOutletContext<DashboardContext>();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  if (!scan) return null;

  const graphData = (scan as any).graph_data || scan.graph_json;
  const nodes: GraphNode[] = graphData?.nodes ?? [];
  const edges = graphData?.edges ?? [];
  const attackFindings = scan.findings?.filter((f: Finding) => f.plugin === 'attack_path') ?? [];
  const supplyFindings = scan.findings?.filter((f: Finding) => f.plugin === 'supply_chain') ?? [];

  const zoneColors: Record<string, string> = {
    PUBLIC: 'bg-orange-500', DMZ: 'bg-blue-500', INTERNAL: 'bg-red-500', PRIVATE: 'bg-purple-500', RESTRICTED: 'bg-yellow-500',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Graph Visualization */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Network className="w-4 h-4 text-blue-400" />Network Topology — {nodes.length} Nodes, {edges.length} Edges</h3>
          <div className="flex gap-2">
            {Object.entries(zoneColors).map(([z, c]) => (
              <span key={z} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]"><div className={`w-2 h-2 rounded-full ${c}`} />{z}</span>
            ))}
          </div>
        </div>
        {/* Node Grid (interactive representation) */}
        <div className="p-6 min-h-[320px]">
          <div className="flex flex-wrap gap-3">
            {nodes.map((node: GraphNode) => (
              <button key={node.id} onClick={() => setSelectedNode(node)}
                className={`relative group px-3 py-2 bg-[#0A0F1E] border rounded-lg text-xs transition-all hover:scale-105 ${selectedNode?.id === node.id ? 'border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-[#1F2937] hover:border-blue-500/40'}`}
                style={{ minWidth: `${Math.max(60, node.blast_radius * 8)}px` }}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${zoneColors[node.zone] || 'bg-gray-500'}`} />
                <div className="font-mono text-[10px] text-[#6B7280] mb-1">{node.type}</div>
                <div className="text-white font-medium truncate">{node.name || node.id}</div>
                <div className="text-[10px] text-[#6B7280] mt-0.5">BR: {node.blast_radius}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="bg-[#111827] border border-blue-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.1)] animate-slideIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" />{selectedNode.name || selectedNode.id}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-[#6B7280] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div><span className="text-[#6B7280]">Type</span><div className="text-white font-medium mt-1">{selectedNode.type}</div></div>
            <div><span className="text-[#6B7280]">Zone</span><div className="text-white font-medium mt-1">{selectedNode.zone}</div></div>
            <div><span className="text-[#6B7280]">Blast Radius</span><div className="text-white font-medium mt-1">{selectedNode.blast_radius}</div></div>
            <div><span className="text-[#6B7280]">Encryption</span><div className="text-white font-medium mt-1">{selectedNode.encryption_type}</div></div>
            <div><span className="text-[#6B7280]">Sensitivity</span><div className="text-white font-medium mt-1">{selectedNode.data_sensitivity}</div></div>
            <div><span className="text-[#6B7280]">CVE</span><div className="text-white font-medium mt-1">{selectedNode.cve_id || 'None'}</div></div>
            <div><span className="text-[#6B7280]">CVSS Live</span><div className="text-white font-medium mt-1">{selectedNode.cvss_live?.toFixed(1) ?? '—'}</div></div>
            <div><span className="text-[#6B7280]">Known Exploit</span><div className="text-white font-medium mt-1">{selectedNode.known_exploit ? '⚠ Yes' : 'No'}</div></div>
          </div>
        </div>
      )}

      {/* Two-column: Attack Paths + Supply Chain CVEs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attack Path Narratives */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1F2937]">
            <h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />Attack Paths ({attackFindings.length})</h3>
          </div>
          <div className="divide-y divide-[#1F2937] max-h-[400px] overflow-y-auto">
            {attackFindings.map((f: Finding, i: number) => (
              <div key={i} className="px-6 py-4 hover:bg-[#1A2234] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={f.severity} />
                  <span className="font-mono text-xs text-blue-400">{f.rule_id}</span>
                </div>
                <p className="text-sm text-[#9CA3AF]">{f.description}</p>
                {f.ai_opinion?.reason && <p className="text-xs text-[#6B7280] mt-2 italic">{f.ai_opinion.reason}</p>}
              </div>
            ))}
            {attackFindings.length === 0 && <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No attack paths detected</div>}
          </div>
        </div>

        {/* Supply Chain CVEs */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1F2937]">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" />Supply Chain CVEs ({supplyFindings.length})</h3>
          </div>
          <div className="divide-y divide-[#1F2937] max-h-[400px] overflow-y-auto">
            {supplyFindings.map((f: Finding, i: number) => (
              <div key={i} className="px-6 py-4 hover:bg-[#1A2234] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={f.severity} />
                  <span className="font-mono text-xs text-amber-400">{f.cve_id || f.rule_id}</span>
                  {f.cvss && <span className="text-xs text-[#6B7280]">CVSS {f.cvss.toFixed(1)}</span>}
                </div>
                <p className="text-sm text-[#9CA3AF]">{f.description}</p>
                {f.fix_version && <p className="text-xs text-green-400 mt-1">Fix: upgrade to {f.fix_version}</p>}
              </div>
            ))}
            {supplyFindings.length === 0 && <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No supply chain CVEs detected</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
