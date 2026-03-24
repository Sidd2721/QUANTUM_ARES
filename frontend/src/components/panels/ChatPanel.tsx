import { useState, useRef, useEffect } from 'react';
import { Zap, Send, Brain, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tier?: string;
  source?: string;
}

export function ChatPanel({ scanId }: { scanId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    
    try {
      const { data } = await axios.post('/api/v1/chat',
        { scan_id: scanId, question: text },
        { headers: { Authorization: `Bearer ${localStorage.getItem('qa_token')}` } }
      );
      
      const botMsg: Message = {
        role: 'assistant',
        content: data.answer || "I'm sorry, I couldn't generate a response based on the current context.",
        tier: data.tier,
        source: data.source,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error communicating with AI engine. Validation environment might be restricted." 
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chips = [
    "What are the critical issues?",
    "Explain quantum risk",
    "Show compliance status",
    "Top 3 remediation steps"
  ];

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col pt-0">
      
      {/* Header */}
      <div className="shrink-0 h-16 border-b border-[var(--border-subtle)] flex items-center justify-between px-6 bg-[var(--bg-base)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--cyan-400)]/30 flex items-center justify-center text-[var(--cyan-400)]">
            <Zap className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-['Syne'] font-bold text-[15px] text-white">ARES AI Assistant</h2>
            <div className="font-['JetBrains_Mono'] text-[11px] text-[var(--text-muted)] -mt-0.5">Session: {scanId?.slice(0, 8)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--low)] animate-pulse"></span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full p-6 space-y-6" ref={scrollRef}>
        
        {/* Welcome Block */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto pb-10">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--cyan-400)] mb-6 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <Brain className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="font-['Syne'] font-bold text-[24px] text-white mb-2">AI Security Advisor active.</h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8">
              How can I help with this validation session? I have full context of all nodes, attack paths, and compliance violations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {chips.map((chip, i) => (
                <button 
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] hover:text-[var(--cyan-400)] text-[12px] font-medium text-[var(--text-secondary)] transition-all flex items-center gap-2 group text-left leading-tight"
                >
                  <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--cyan-400)] shrink-0" /> {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Messages */}
        {messages.map((msg, idx) => (
           <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               
               {/* Bubble */}
               <div className={`
                 px-5 py-3.5 text-[14px] leading-relaxed relative
                 ${msg.role === 'user' 
                   ? 'bg-[var(--cyan-600)] text-white rounded-2xl rounded-tr-sm shadow-xl' 
                   : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm shadow-lg'}
               `}>
                 <div className="whitespace-pre-wrap">{msg.content}</div>
               </div>
               
               {/* Metadata (Tier, Source) */}
               {msg.role === 'assistant' && (
                 <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
                   {msg.tier && (
                     <span className={`font-['JetBrains_Mono'] text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                       msg.tier === 'semantic' 
                         ? 'bg-[var(--low-bg)] text-[var(--low)] border-[var(--low)]/30' 
                         : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-default)]'
                     }`}>
                       <Zap className={`w-2.5 h-2.5 ${msg.tier === 'semantic' ? 'text-[var(--low)]' : 'text-[var(--cyan-400)]'}`} /> 
                       {msg.tier === 'semantic' ? 'Source Verified (NIST/DPDP)' : msg.tier}
                     </span>
                   )}
                   {msg.source && (
                     <button className="text-[10px] text-[var(--cyan-500)] underline underline-offset-2 hover:text-[var(--cyan-400)] flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                       📖 {msg.source}
                     </button>
                   )}
                 </div>
               )}

             </div>
           </div>
        ))}
        
        {typing && (
          <div className="flex w-full justify-start">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-6 bg-[var(--bg-base)] border-t border-[var(--border-subtle)] z-10 w-full pb-8">
        <div className="relative flex items-end">
          <textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your security results, mitigation steps, or compliance status..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-4 pl-5 pr-14 text-[14px] text-white resize-none outline-none focus:border-[var(--border-accent)] focus:ring-4 focus:ring-[var(--cyan-glow)] transition-all min-h-[60px] max-h-[160px] placeholder-[var(--text-muted)] shadow-inner"
            rows={1}
            style={{ height: input.split('\n').length > 1 ? `${Math.min(160, 60 + (input.split('\n').length - 1) * 24)}px` : '60px' }}
          />
          <button 
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-lg bg-[var(--cyan-500)] text-black flex items-center justify-center hover:bg-[var(--cyan-400)] disabled:opacity-50 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] transition-all shadow-md group"
          >
            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px] group-hover:translate-x-[1px] group-hover:translate-y-[-1px] transition-transform" strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center mt-3 text-[11px] text-[var(--text-muted)] font-['JetBrains_Mono']">
          ARES responses are AI-generated and should be verified against organizational policies.
        </div>
      </div>

    </div>
  );
}
