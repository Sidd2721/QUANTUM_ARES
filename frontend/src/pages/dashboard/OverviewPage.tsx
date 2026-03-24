import { useState, useEffect } from 'react';
import { Target, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router';
import axios from 'axios';

export function OverviewPage() {
  const [stats, setStats] = useState({ total_scans: 0, avg_score: 0, critical_vuls: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('qa_token');
      const { data } = await axios.get('/api/v1/scans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const completeScans = data.filter((s:any) => s.status === 'complete' || s.status === 'completed');
      
      let criticals = 0;
      let scoreSum = 0;
      
      completeScans.forEach((s: any) => {
        scoreSum += parseFloat(s.security_index || 0);
        if (s.executive_summary?.critical_count) criticals += s.executive_summary.critical_count;
        if (s.findings) {
           criticals += s.findings.filter((f:any)=>f.severity === 'CRITICAL').length;
        }
      });
      
      setStats({
        total_scans: completeScans.length,
        avg_score: completeScans.length ? Math.round(scoreSum / completeScans.length) : 0,
        critical_vuls: criticals
      });
      
      setRecentScans(completeScans.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
    } catch(e) {
      console.error(e);
    }
  };

  const getScoreColor = (score: number) => score < 40 ? 'text-[var(--critical)]' : score < 60 ? 'text-[var(--high)]' : score < 80 ? 'text-[var(--medium)]' : 'text-[var(--low)]';

  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="font-['Syne'] font-bold text-[28px] text-white">Security Overview</h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1 font-medium">Organization-wide threat intelligence summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] mb-4">
             <div className="w-8 h-8 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--cyan-400)]"><Activity className="w-4 h-4" /></div>
             <span className="font-medium">Total Assessments</span>
          </div>
          <div className="font-['JetBrains_Mono'] text-[42px] font-bold text-white">{stats.total_scans}</div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] mb-4">
             <div className="w-8 h-8 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--low)]"><Target className="w-4 h-4" /></div>
             <span className="font-medium">Average Security Index</span>
          </div>
          <div className={`font-['JetBrains_Mono'] text-[42px] font-bold ${getScoreColor(stats.avg_score)}`}>{stats.avg_score}</div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] mb-4">
             <div className="w-8 h-8 rounded bg-[var(--critical-bg)] border border-[var(--critical)]/30 flex items-center justify-center text-[var(--critical)]"><ShieldAlert className="w-4 h-4" /></div>
             <span className="font-medium">Unresolved Criticals</span>
          </div>
          <div className={`font-['JetBrains_Mono'] text-[42px] font-bold ${stats.critical_vuls > 0 ? 'text-[var(--critical)]' : 'text-[var(--low)]'}`}>
            {stats.critical_vuls}
          </div>
        </div>
      </div>

      <h2 className="font-['Syne'] font-bold text-[18px] text-white mb-4">Recent Architecture Validations</h2>
      <div className="card">
         <table className="w-full text-left border-collapse">
            <thead className="bg-[#080B14]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Scan ID</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Target Name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Score</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Date completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {recentScans.map(scan => {
                const score = parseFloat(scan.security_index || 0);
                return (
                  <tr key={scan.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                     <td className="px-6 py-4 font-['JetBrains_Mono'] text-[12px] text-[var(--cyan-400)]">{scan.id.slice(0,8)}</td>
                     <td className="px-6 py-4 text-[14px] text-white font-medium hover:text-[var(--cyan-400)]">
                        <Link to={`/dashboard/scan/${scan.id}`}>{scan.name || 'Infrastructure State'}</Link>
                     </td>
                     <td className={`px-6 py-4 font-['JetBrains_Mono'] text-[14px] font-bold ${getScoreColor(score)}`}>{Math.round(score)}</td>
                     <td className="px-6 py-4 font-['JetBrains_Mono'] text-[12px] text-[var(--text-muted)]">{new Date(scan.created_at).toLocaleString()}</td>
                  </tr>
                )
              })}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)] italic">No assessment history found.</td>
                </tr>
              )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
