import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import { Server, Database, Cloud, ShieldAlert, Cpu } from 'lucide-react';

cytoscape.use(fcose);

const ZONE_COLORS: Record<string, string> = {
  PUBLIC: 'var(--zone-public)',
  DMZ: 'var(--zone-dmz)',
  INTERNAL: 'var(--zone-internal)',
  PRIVATE: 'var(--zone-private)',
  RESTRICTED: 'var(--zone-restricted)'
};

export function GraphPanel({ scan }: { scan: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current || !scan.graph_json) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...(scan.graph_json.nodes || []).map((n: any) => ({
          data: {
            id: n.id,
            label: n.name || n.id,
            zone: n.zone || 'INTERNAL',
            blast: n.blast_radius || 0,
            sensitivity: n.data_sensitivity || 'LOW',
            cvss: n.cvss_live || 0,
            cve: n.cve,
            type: n.type || 'server',
            encryption: n.encryption_type
          }
        })),
        ...(scan.graph_json.edges || []).map((e: any, i: number) => ({
          data: {
            id: `e${i}`,
            source: e.source,
            target: e.target,
            auth: e.auth_required,
            mfa: e.mfa_required,
            tls: e.tls_enforced,
            is_attack_path: scan.executive_summary?.attack_stories?.some((s: string) => s.includes(e.source) && s.includes(e.target))
          }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => ZONE_COLORS[ele.data('zone')] || '#3B82F6',
            'width': (ele) => Math.max(24, 24 + ele.data('blast') * 0.4),
            'height': (ele) => Math.max(24, 24 + ele.data('blast') * 0.4),
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-size': '10px',
            'font-family': 'JetBrains Mono',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'border-width': (ele) => ele.data('cvss') > 7 ? 2 : 0,
            'border-color': '#EF4444',
          }
        },
        {
          selector: 'edge',
          style: {
            'line-color': (ele) => ele.data('auth') ? '#22D3EE' : '#EF4444',
            'line-style': (ele) => ele.data('auth') ? 'solid' : 'dashed',
            'width': 1.5,
            'target-arrow-shape': 'triangle',
            'target-arrow-color': (ele) => ele.data('auth') ? '#22D3EE' : '#EF4444',
            'curve-style': 'bezier',
            'opacity': 0.7,
          }
        },
        {
          selector: '.attack-path',
          style: { 'line-color': '#EF4444', 'line-style': 'dashed', 'width': 3, 'opacity': 1 }
        },
        {
          selector: ':selected',
          style: { 'border-width': 3, 'border-color': '#FBBF24', 'opacity': 1 }
        }
      ],
      layout: { name: 'fcose', randomize: true, animate: true, animationDuration: 600 } as any
    });

    cy.edges('[!auth]').addClass('attack-path');

    cy.on('tap', 'node', (evt) => {
      setSelectedNode(evt.target.data());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) setSelectedNode(null);
    });

    cyRef.current = cy;

    return () => { cy.destroy(); };
  }, [scan]);

  // Compute findings for the selected node
  const nodeFindings = selectedNode ? 
    (scan.findings || []).filter((f: any) => f.affected_nodes?.includes(selectedNode.id)) 
    : [];

  return (
    <div className="flex w-full h-full bg-[var(--bg-base)] overflow-hidden">
      
      {/* Graph Area (65%) */}
      <div className="w-[65%] h-full relative border-r border-[var(--border-subtle)]">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-[var(--bg-surface)]/90 backdrop-blur border border-[var(--border-subtle)] p-4 rounded-lg shadow-xl shrink-0">
          <div className="text-[11px] font-['Syne'] font-bold text-[var(--text-secondary)] tracking-wider mb-2">ZONES</div>
          <div className="space-y-1.5 mb-4">
            {Object.entries(ZONE_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 text-[11px] font-['JetBrains_Mono'] text-[var(--text-primary)]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span> {name}
              </div>
            ))}
          </div>

          <div className="text-[11px] font-['Syne'] font-bold text-[var(--text-secondary)] tracking-wider mb-2">EDGES</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-['JetBrains_Mono'] text-[var(--text-primary)]">
              <div className="w-6 h-0 border-t-2 border-[var(--cyan-400)]"></div> Normal (Auth)
            </div>
            <div className="flex items-center gap-2 text-[11px] font-['JetBrains_Mono'] text-[var(--text-primary)]">
              <div className="w-6 h-0 border-t-[3px] border-dashed border-[var(--critical)]"></div> Attack Path
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Inspector (35%) */}
      <div className="w-[35%] h-full bg-[var(--bg-surface)] overflow-y-auto p-6 scrollbar-hide">
        {selectedNode ? (
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center text-[var(--cyan-400)]">
                  {selectedNode.type === 'database' ? <Database className="w-5 h-5"/> : 
                   selectedNode.type === 'gateway' ? <Cloud className="w-5 h-5"/> :
                   <Server className="w-5 h-5"/>}
                </div>
                <div>
                  <h3 className="font-['Syne'] font-bold text-[18px] text-white leading-tight">{selectedNode.label}</h3>
                  <div className="font-['JetBrains_Mono'] text-[12px] text-[var(--text-muted)] mt-1">{selectedNode.id}</div>
                </div>
              </div>
              <div 
                className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider"
                style={{ backgroundColor: ZONE_COLORS[selectedNode.zone], color: '#fff' }}
              >
                {selectedNode.zone}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <PropertyRow label="Sensitivity" value={selectedNode.sensitivity} badge={selectedNode.sensitivity} />
              <PropertyRow label="Encryption" value={selectedNode.encryption || 'NONE'} mono />
              <PropertyRow label="Live CVSS" value={selectedNode.cvss > 0 ? selectedNode.cvss.toFixed(1) : '0.0'} 
                           mono color={selectedNode.cvss > 7 ? 'text-[var(--critical)]' : selectedNode.cvss > 4 ? 'text-[var(--high)]' : 'text-[var(--text-primary)]'} />
              {selectedNode.cve && <PropertyRow label="CVE Exploits" value={selectedNode.cve} mono color="text-[var(--critical)]" />}
              
              <div className="mt-2 text-[13px] text-[var(--text-secondary)] font-medium">Blast Radius</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--ap-color)] rounded-full" style={{ width: `${Math.min(100, selectedNode.blast)}%` }}></div>
                </div>
                <div className="font-['JetBrains_Mono'] text-[12px] text-white w-8">{selectedNode.blast}%</div>
              </div>
            </div>

            <h4 className="font-['Syne'] font-semibold text-[14px] text-[var(--text-secondary)] mb-4">Findings on this Node ({nodeFindings.length})</h4>
            <div className="space-y-3">
              {nodeFindings.length === 0 ? (
                <div className="text-[13px] text-[var(--text-muted)] italic">No active vulnerabilities here.</div>
              ) : (
                nodeFindings.map((f: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg bg-[var(--bg-base)] border-l-[3px] border-[var(--border-subtle)] cursor-default`}
                       style={{ borderLeftColor: f.severity === 'CRITICAL' ? 'var(--critical)' : f.severity === 'HIGH' ? 'var(--high)' : f.severity === 'MEDIUM' ? 'var(--medium)' : 'var(--low)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="font-['JetBrains_Mono'] text-[11px] font-bold text-white px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">{f.rule_id}</div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{f.plugin}</div>
                    </div>
                    <div className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{f.description}</div>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
            <Cpu className="w-12 h-12 mb-4 opacity-20" strokeWidth={1} />
            <div className="font-['Syne'] text-[18px] font-semibold text-[var(--text-secondary)] mb-2">Node Inspector</div>
            <div className="text-[13px] text-center max-w-[200px]">Click any node on the graph to view security properties and active findings.</div>
          </div>
        )}
      </div>

    </div>
  );
}

function PropertyRow({ label, value, badge, mono, color }: { label: string, value: string, badge?: string, mono?: boolean, color?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 last:border-0 last:pb-0">
      <span className="text-[13px] text-[var(--text-secondary)] font-medium">{label}</span>
      {badge ? (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] ${badge === 'CRITICAL' ? 'text-[var(--critical)]' : badge === 'HIGH' ? 'text-[var(--high)]' : 'text-[var(--text-primary)]'}`}>
          {value}
        </span>
      ) : (
        <span className={`text-[13px] ${mono ? "font-['JetBrains_Mono']" : ""} ${color || 'text-white'}`}>{value}</span>
      )}
    </div>
  );
}
