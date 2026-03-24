import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { FileText, Download, Target, CalendarDays, ExternalLink, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('qa_token');
        const res = await axios.get('/api/v1/scans', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter scans that are complete to show them as "Reports"
        const completed = res.data.filter((s: any) => s.status === 'complete' || s.status === 'completed');
        
        // Sort newest first
        const sorted = completed.sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        
        setReports(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadPdf = async (scanId: string, scanName: string) => {
    try {
      const token = localStorage.getItem('qa_token');
      const res = await axios.get(`/api/v1/reports/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data], {type:'application/pdf'}));
      const a = document.createElement('a');
      a.href = url;
      a.download = `RPT-${scanId.slice(0,3).toUpperCase()}_${scanName || 'Assessment'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("Failed to download PDF.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="font-['Syne'] font-bold text-[28px] text-white">Generated Reports</h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1 font-medium flex items-center gap-2">
          {reports.length} blockchain-anchored reports available
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#080B14]">
            <tr>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Report ID</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Session Name</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Date</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Score</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">Status</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-['DM_Sans']">
            {loading ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                   Loading secure reports...
                 </td>
               </tr>
            ) : reports.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] italic">
                   No completed reports found. Start a new assessment to generate one.
                 </td>
               </tr>
            ) : (
              reports.map((report) => {
                const score = parseFloat(report.security_index || 0);
                const color = score < 40 ? 'var(--critical)' : score < 60 ? 'var(--high)' : score < 80 ? 'var(--medium)' : 'var(--low)';
                
                return (
                  <tr key={report.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-['JetBrains_Mono'] text-[12px] bg-[var(--bg-base)] border border-[var(--border-default)] px-2.5 py-1 rounded w-fit text-white group-hover:border-[var(--border-accent)]">
                        RPT-{report.id.slice(0,4).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-medium text-white group-hover:text-[var(--cyan-400)] transition-colors cursor-pointer flex items-center gap-2">
                        <Link to={`/dashboard/scan/${report.id}`}>{report.name || 'Validation Session'}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[var(--text-muted)] font-['JetBrains_Mono']">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 36 36" className="w-6 h-6 rotate-[-90deg]">
                          <path stroke="var(--border-default)" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path stroke={color} strokeWidth="4" fill="none" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="font-['JetBrains_Mono'] text-[13px] text-white font-bold">{Math.round(score)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--low)] tracking-widest uppercase">
                        <span className="w-2 h-2 rounded-full bg-[var(--low)]"></span> COMPLETE
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => downloadPdf(report.id, report.name)}
                        className="px-3 py-1.5 rounded bg-[var(--bg-base)] border border-[var(--border-default)] hover:border-[var(--low)] text-[var(--text-secondary)] hover:text-[var(--low)] text-[12px] font-medium inline-flex items-center gap-2 transition-all opacity-80 group-hover:opacity-100"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center gap-2 text-[12px] text-[var(--text-muted)] font-medium font-['DM_Sans']">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--low)]"></span> All reports are blockchain-anchored and tamper-proof. Validated by QUANTUM-ARES Engine.
        </div>
      </div>
    </div>
  );
}
