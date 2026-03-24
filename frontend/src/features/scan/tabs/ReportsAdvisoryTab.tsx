import { useState } from 'react';
import { useOutletContext } from 'react-router';
import type { DashboardContext } from '../DashboardShell';
import { FileText, Download, Shield, Loader2, CheckCircle2, Send, Sparkles, Search, MessageSquare } from 'lucide-react';
import { reportService } from '../../../services/report.service';
import { chatService } from '../../../services/chat.service';

interface ChatMsg { role: 'user' | 'assistant'; content: string; tier?: string }

export default function ReportsAdvisoryTab() {
  const { scan, scanId } = useOutletContext<DashboardContext>();
  const [reportState, setReportState] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [reportMeta, setReportMeta] = useState<{ report_id?: string; sha256?: string }>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!scan) return null;

  const handleGenerate = async () => {
    if (!scanId) return;
    setReportState('generating');
    try {
      const data = await reportService.generate(scanId);
      setReportMeta(data);
      setReportState('ready');
    } catch { setReportState('error'); }
  };

  const handleDownload = async () => {
    if (!reportMeta.report_id) return;
    try { await reportService.download(reportMeta.report_id); } catch {}
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsSending(true);
    try {
      const data = await chatService.ask(question);
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, tier: data.tier }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that question.' }]);
    } finally { setIsSending(false); }
  };

  const suggestions = [
    'What is the most critical vulnerability?',
    'How does our NIST compliance look?',
    'Which nodes are most at risk from quantum attacks?',
    'What should I fix first to improve the score?',
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Report Card */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" />Security Assessment Report</h3>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Shield className="w-3.5 h-3.5" /> RSA-2048 Signed • Verified
          </div>
        </div>

        {reportState === 'ready' && reportMeta.sha256 && (
          <div className="mb-4 bg-[#0A0F1E] border border-[#1F2937] rounded-lg p-4">
            <div className="text-xs text-[#6B7280] mb-1">SHA-256 Fingerprint</div>
            <div className="font-mono text-xs text-[#9CA3AF] break-all select-all">{reportMeta.sha256}</div>
          </div>
        )}

        <div className="flex gap-3">
          {reportState === 'idle' && (
            <button onClick={handleGenerate} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Generate Report
            </button>
          )}
          {reportState === 'generating' && (
            <div className="flex-1 py-3 bg-blue-600/50 rounded-lg text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
            </div>
          )}
          {reportState === 'ready' && (
            <button onClick={handleDownload} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          )}
          {reportState === 'error' && (
            <button onClick={handleGenerate} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2">
              Retry Generation
            </button>
          )}
        </div>
      </div>

      {/* AI Advisory Chat */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
        <div className="px-6 py-4 border-b border-[#1F2937]">
          <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-400" />AI Security Advisor</h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">Ask anything about your security posture</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1A2234] border border-[#1F2937] text-[#9CA3AF]'}`}>
                {msg.content}
                {msg.tier && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    {msg.tier === 'rule' ? <Sparkles className="w-3 h-3 text-amber-400" /> : <Search className="w-3 h-3 text-blue-400" />}
                    <span className="text-[#6B7280]">{msg.tier === 'rule' ? '⚡ Rule Engine' : '🔍 NIST/DPDP Search'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-[#1A2234] border border-[#1F2937] rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#6B7280]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => { setChatInput(s); }} className="px-3 py-1.5 bg-[#1A2234] border border-[#1F2937] rounded-full text-xs text-[#9CA3AF] hover:border-blue-500/40 hover:text-white transition-all">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#1F2937]">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about your security posture..."
              className="flex-1 px-4 py-2.5 bg-[#0A0F1E] border border-[#1F2937] rounded-lg text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-blue-500/50 transition-all" />
            <button type="submit" disabled={isSending || !chatInput.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
