import { useMemo } from 'react';
import { Shield, Zap, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function QuantumRiskPanel({ scan }: { scan: any }) {

  const quantumFindings = (scan.findings || []).filter((f: any) => f.plugin === 'quantum');
  
  // Build chart data 2024-2035 max risk
  const chartData = useMemo(() => {
    const data = [];
    let baseRisk = 20;

    for (let year = 2024; year <= 2035; year++) {
      // Find findings active in this year or earlier
      const activeFindings = quantumFindings.filter((f: any) => (f.risk_year || 2029) <= year);
      
      let computedRisk = baseRisk;
      if (activeFindings.length > 0) {
        // Use highest QVI available for this year
        computedRisk = Math.max(...activeFindings.map((f: any) => f.qvi || 85));
      }
      
      data.push({
        year: year.toString(),
        risk: computedRisk,
        migration: Math.max(0, computedRisk - ((year - 2025) * 8)) // Hypothetical migration risk
      });
      
      if (year < 2029) baseRisk += 5; // Natural escalation
    }
    return data;
  }, [quantumFindings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-lg shadow-xl">
          <p className="font-['JetBrains_Mono'] text-[13px] text-white font-bold mb-2">{label}</p>
          <p className="text-[12px] text-[var(--critical)] flex justify-between gap-4 font-['JetBrains_Mono']">
            <span>Cryptographic Risk:</span> <span>{payload[0].value.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8 flex flex-col h-full overflow-hidden">
      
      {/* Top: HNDL Timeline */}
      <div className="w-full h-[380px] shrink-0 card !border-[var(--border-subtle)] p-6 mb-8 relative">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="font-['Syne'] font-bold text-[18px] text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--q-color)]" fill="currentColor" opacity={0.2} />
              Harvest-Now-Decrypt-Later (HNDL) Risk Timeline
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Cryptographic risk exposure as quantum computing approaches practical capability by 2029.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium font-['JetBrains_Mono'] bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-1.5 rounded">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[var(--critical)]"></span> Current Cryptography Risk</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[var(--cyan-500)]"></span> Quantum Migration Path</div>
          </div>
        </div>
        
        <div className="w-full h-[260px] ml-[-15px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--critical)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--critical)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMigr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cyan-500)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--cyan-500)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--border-default)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickMargin={10} minTickGap={15} />
              <YAxis stroke="var(--border-default)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              
              <ReferenceLine y={60} stroke="var(--high)" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: 'Harvest Window Minimum', fill: 'var(--high)', fontSize: 10, dy: -4, outline: 'none' }} />
              <ReferenceLine x="2029" stroke="var(--critical)" strokeDasharray="4 4" 
                label={{ position: 'top', value: 'Quantum Threat Horizon', fill: 'var(--critical)', fontSize: 11, fontWeight: 'bold' }} />

              <Area type="monotone" dataKey="risk" stroke="var(--critical)" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" activeDot={{ r: 6, fill: 'var(--critical)', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="migration" stroke="var(--cyan-500)" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorMigr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: QVI Table Container */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-surface)] flex justify-between items-center">
          <h3 className="font-['Syne'] font-bold text-[16px] text-white">Quantum Risk per Node</h3>
          <span className="text-[12px] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[var(--q-color)]">
            {quantumFindings.length} Exposed Configurations
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#080B14] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Node ID</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Encryption Type</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">QVI</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Risk Year</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {quantumFindings.map((f: any, idx: number) => {
                const node = scan.graph_json?.nodes?.find((n: any) => n.id === f.affected_nodes?.[0]) || { encryption_type: 'Unknown' };
                const qvi = parseFloat((f.qvi || 85).toString());
                const riskColor = qvi > 70 ? 'var(--critical)' : qvi > 40 ? 'var(--high)' : 'var(--low)';
                
                return (
                  <tr key={idx} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-5 py-3.5 font-['JetBrains_Mono'] text-[12px] text-white">{f.affected_nodes?.[0]}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--text-secondary)]">
                      {node.encryption_type || 'AES-256-GCM / RSA-2048'}
                    </td>
                    <td className="px-5 py-3.5 font-['JetBrains_Mono'] text-[13px] font-bold" style={{ color: riskColor }}>
                      {qvi.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5 font-['JetBrains_Mono'] text-[12px] text-white">{f.risk_year || 2029}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase
                        ${f.severity === 'CRITICAL' ? 'bg-[var(--critical-bg)] text-[var(--critical)] border border-[var(--critical)]/30' : 
                          f.severity === 'HIGH' ? 'bg-[var(--high-bg)] text-[var(--high)] border border-[var(--high)]/30' : 
                          'bg-[var(--medium-bg)] text-[var(--medium)] border border-[var(--medium)]/30'}`}>
                        {f.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {quantumFindings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[var(--text-muted)] italic">
                    No quantum-vulnerable configurations detected in this infrastructure.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Compliance Footer */}
        <div className="shrink-0 p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span className="leading-tight">
            NIST FIPS 203 mandates ML-KEM-768 migration by 2025.<br className="md:hidden" />
            <span className="hidden md:inline"> </span>DPDP Act 2023 §8(3) requires encryption standards review annually.
          </span>
        </div>
      </div>

    </div>
  );
}
