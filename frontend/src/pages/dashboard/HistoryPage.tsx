import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import axios from 'axios';

export function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const token = localStorage.getItem('qa_token');
      const { data } = await axios.get('/api/v1/scans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScans(data.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-[var(--low)]" />;
      case 'failed':    return <AlertCircle className="w-4 h-4 text-[var(--critical)]" />;
      default:          return <Loader2 className="w-4 h-4 text-[var(--cyan-400)] animate-spin" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="font-['Syne'] font-bold text-[28px] text-white">Scan History</h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1 font-medium">Log of all infrastructure scans initiated</p>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-[var(--border-subtle)]">
          {loading ? (
             <div className="p-12 text-center text-[var(--text-muted)]">Loading log trace...</div>
          ) : scans.length === 0 ? (
             <div className="p-12 text-center text-[var(--text-muted)] italic">No historical scans available.</div>
          ) : (
            scans.map(s => (
              <div key={s.id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                     {getStatusIcon(s.status)}
                   </div>
                   <div>
                      <div className="font-['Syne'] text-[15px] font-bold text-white mb-0.5 max-w-sm truncate">
                        {s.name || 'Unnamed Session'}
                      </div>
                      <div className="font-['JetBrains_Mono'] text-[11px] text-[var(--text-muted)] flex items-center gap-3">
                         <span>{s.id}</span>
                         <span>{new Date(s.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Status</div>
                      <div className={`font-['JetBrains_Mono'] text-[12px] font-bold uppercase ${s.status === 'failed' ? 'text-[var(--critical)]' : s.status === 'complete' || s.status === 'completed' ? 'text-[var(--low)]' : 'text-[var(--cyan-400)]'}`}>
                         {s.status}
                      </div>
                   </div>
                   {(s.status === 'complete' || s.status === 'completed') ? (
                     <Link to={`/dashboard/scan/${s.id}`} className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-white rounded-lg text-[13px] font-medium transition-colors text-[var(--text-secondary)]">
                       View Results
                     </Link>
                   ) : (
                     <div className="w-[105px] h-9"></div> // Placeholder to align
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
