export function ScorePanel({ scan }: { scan: any }) {
  const score = scan.security_index;
  const ex = scan.executive_summary || {};
  
  const isCritical = score < 40;
  const isHigh     = score >= 40 && score < 60;
  const isMedium   = score >= 60 && score < 80;

  const ringColor = isCritical ? 'var(--score-critical)' : 
                    isHigh ? 'var(--score-high)' : 
                    isMedium ? 'var(--score-medium)' : 'var(--score-low)';

  const ringBgClass = isCritical ? 'bg-[var(--critical-bg)] text-[var(--critical)]' :
                      isHigh ? 'bg-[var(--high-bg)] text-[var(--high)]' :
                      isMedium ? 'bg-[var(--medium-bg)] text-[var(--medium)]' : 'bg-[var(--low-bg)] text-[var(--low)]';
                      
  const ringLabel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';

  const breakdown = scan.score_breakdown || { zero_trust: 0, quantum: 0, attack_path: 0, supply_chain: 0, compliance: 0 };
  const weights = {
    zero_trust: 35,
    quantum: 20,
    attack_path: 25,
    supply_chain: 10,
    compliance: 10
  };

  const engines = [
    { id: 'zero_trust', name: 'Zero-Trust Engine',         color: 'var(--zt-color)',   w: weights.zero_trust, val: breakdown.zero_trust, label: '35%' },
    { id: 'quantum',    name: 'Quantum Risk Engine',       color: 'var(--q-color)',    w: weights.quantum,    val: breakdown.quantum,    label: '20%' },
    { id: 'attack_path',name: 'Attack Path Engine',        color: 'var(--ap-color)',   w: weights.attack_path,val: breakdown.attack_path,label: '25%' },
    { id: 'supply_chain',name: 'Supply Chain Engine',      color: 'var(--sc-color)',   w: weights.supply_chain,val: breakdown.supply_chain,label: '10%' },
    { id: 'compliance', name: 'Compliance Engine',         color: 'var(--comp-color)', w: weights.compliance,  val: breakdown.compliance,  label: '10%' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Col 1: Score Ring */}
      <div className="card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-[200px] h-[200px] relative flex items-center justify-center mb-6">
          <svg viewBox="0 0 36 36" className="w-[200px] h-[200px] rotate-[-90deg]">
            <path stroke="var(--border-subtle)" strokeWidth="2.5" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke={ringColor} strokeWidth="2.5" fill="none" strokeDasharray={`${score}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <div className="font-['JetBrains_Mono'] font-extrabold text-[52px] leading-none text-white tracking-tighter">
              {Math.round(score)}
            </div>
            <div className="text-[16px] text-[var(--text-muted)] mt-1">/ 100</div>
          </div>
        </div>
        
        <div className={`px-4 py-1.5 rounded-md font-['Syne'] font-bold text-[11px] uppercase tracking-wider mb-6 ${ringBgClass}`}>
          {ringLabel} RISK EXPOSURE
        </div>

        <div className="flex gap-8 text-center text-[13px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[24px] text-[var(--critical)] mb-1">{ex.critical_count || 0}</div>
            <div className="text-[var(--text-muted)]">Critical Findings</div>
          </div>
          <div>
            <div className="font-['JetBrains_Mono'] text-[24px] text-[var(--ap-color)] mb-1">{ex.attack_paths || 0}</div>
            <div className="text-[var(--text-muted)]">Attack Paths</div>
          </div>
        </div>
      </div>

      {/* Col 2: Engine Breakdown */}
      <div className="card p-8">
        <h3 className="font-['Syne'] font-semibold text-[16px] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-4 mb-6">Engine Breakdown</h3>
        <div className="space-y-6">
          {engines.map((eng) => (
            <div key={eng.id}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] font-medium text-white">{eng.name}</span>
                <span className="text-[11px] font-['JetBrains_Mono'] text-[var(--text-muted)]">{eng.label} Weight</span>
              </div>
              <div className="w-full h-[8px] bg-[var(--bg-elevated)] rounded-[4px] overflow-hidden">
                <div 
                  className="h-full rounded-[4px]" 
                  style={{ width: `${Math.min(100, Math.max(0, (eng.val / eng.w) * 100))}%`, backgroundColor: eng.color }}
                ></div>
              </div>
              <div className="mt-1.5 text-right font-['JetBrains_Mono'] text-[11px] text-[var(--text-primary)]">
                +{eng.val.toFixed(1)} / {eng.w} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Col 3: Executive Summary */}
      <div className="card p-8 overflow-y-auto">
        <h3 className="font-['Syne'] font-semibold text-[16px] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-4 mb-6">Executive Summary</h3>
        
        <div className="mb-6">
          <div className="text-[12px] font-semibold text-[var(--critical)] uppercase tracking-wider mb-2">Critical Issue</div>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed bg-[var(--critical-bg)] border-l-[3px] border-[var(--critical)] p-3 rounded-r-md">
            {ex.main_risk || 'No critical risks identified initially.'}
          </p>
        </div>

        <div className="mb-6">
          <div className="text-[12px] font-semibold text-[var(--cyan-400)] uppercase tracking-wider mb-2">Recommended Action</div>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            {ex.primary_action || 'Review findings list for guidance.'}
          </p>
        </div>

        {ex.attack_stories && ex.attack_stories.length > 0 && (
          <div className="mb-6">
            <div className="text-[14px] font-medium text-white mb-3">Attack Narratives</div>
            <ul className="space-y-3">
              {ex.attack_stories.slice(0, 3).map((story: string, i: number) => (
                <li key={i} className="text-[13px] text-[var(--text-secondary)] border-l-[2px] border-[var(--ap-color)] pl-3 leading-relaxed">
                  {story}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scan.confidence_warnings && scan.confidence_warnings.length > 0 && (
          <div className="bg-[var(--medium-bg)] border-l-[3px] border-[var(--medium)] p-4 rounded-r-lg mt-6">
            <div className="flex items-center gap-2 text-[var(--medium)] font-semibold text-[13px] mb-1">
              <span className="text-[16px]">⚠</span> Trust Analysis
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              {scan.confidence_warnings.length} edge claims were downgraded because evidence_source is manual (confidence: 0.30).
            </p>
          </div>
        )}
        
      </div>

    </div>
  );
}
