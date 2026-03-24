import { Link } from 'react-router';
import { ArrowRight, Play, Shield, Zap, GitBranch } from 'lucide-react';

const AnimatedThreatGraph = () => {
  // SVG grid visualization of a cyber topology with pulses and attack paths
  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto opacity-90">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--cyan-400)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--cyan-400)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Edges - Background */}
        <line x1="200" y1="200" x2="100" y2="120" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="200" y1="200" x2="320" y2="160" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="200" y1="200" x2="240" y2="300" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="100" y1="120" x2="120" y2="60" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="320" y1="160" x2="360" y2="100" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="240" y1="300" x2="160" y2="320" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="100" y1="120" x2="60" y2="200" stroke="var(--border-default)" strokeWidth="1" />
        <line x1="320" y1="160" x2="300" y2="240" stroke="var(--border-default)" strokeWidth="1" />

        {/* Attack Paths - Animated */}
        <line x1="60" y1="200" x2="100" y2="120" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeDasharray="4 4" className="animate-flow-edge" />
        <line x1="100" y1="120" x2="200" y2="200" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeDasharray="4 4" className="animate-flow-edge" />
        
        <line x1="360" y1="100" x2="320" y2="160" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeDasharray="4 4" className="animate-flow-edge" style={{ animationDelay: '0.5s' }} />

        {/* Nodes */}
        {/* Center: Core DB */}
        <circle cx="200" cy="200" r="14" fill="var(--zone-private)" className="animate-pulse-node" style={{ animationDelay: '0s' }} />
        {/* DMZ Nodes */}
        <circle cx="100" cy="120" r="10" fill="var(--zone-dmz)" className="animate-pulse-node" style={{ animationDelay: '0.4s' }} />
        <circle cx="320" cy="160" r="10" fill="var(--zone-dmz)" className="animate-pulse-node" style={{ animationDelay: '0.8s' }} />
        <circle cx="240" cy="300" r="10" fill="var(--zone-internal)" className="animate-pulse-node" style={{ animationDelay: '1.2s' }} />
        
        {/* Public/External Nodes */}
        <circle cx="120" cy="60" r="6" fill="var(--zone-public)" />
        <circle cx="360" cy="100" r="8" fill="var(--zone-public)" />
        <circle cx="60" cy="200" r="8" fill="var(--zone-public)" />
        
        {/* Restricted processing */}
        <circle cx="160" cy="320" r="8" fill="var(--zone-restricted)" />
        <circle cx="300" cy="240" r="6" fill="var(--zone-internal)" />
      </svg>
    </div>
  );
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-['DM_Sans'] selection:bg-[var(--cyan-glow)] selection:text-[var(--cyan-400)] overflow-x-hidden">
      
      {/* SECTION A — HERO */}
      <section className="relative min-h-[90vh] flex flex-col justify-center border-b border-[var(--border-default)] overflow-hidden">
        {/* Top Navbar overlay inside hero section */}
        <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--cyan-400)]" strokeWidth={1.5} />
            <span className="font-['Syne'] font-bold tracking-tight text-xl">QUANTUM·ARES</span>
          </div>
          <Link to="/login" className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-all">
            CISO Login
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 pt-20">
          {/* Left Column: Copy */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center px-3 py-1 mb-6 border border-[var(--cyan-400)] rounded-full bg-[var(--cyan-glow)]">
              <span className="font-['Syne'] text-[11px] uppercase tracking-widest text-[var(--cyan-400)] font-bold">
                INDIA'S FIRST PRE-DEPLOYMENT SECURITY VALIDATOR
              </span>
            </div>

            <h1 className="font-['Syne'] font-extrabold text-5xl sm:text-6xl md:text-[72px] leading-[1.05] tracking-tight mb-6 text-white text-left">
              Architecture is the new<br />
              <span className="text-[var(--cyan-400)]">perimeter.</span>
            </h1>

            <p className="text-[18px] text-[var(--text-secondary)] mb-10 max-w-[520px] leading-relaxed text-left">
              Validate your infrastructure design before attackers exploit it.
              QUANTUM-ARES gives your CISO a Security Index — like CIBIL for your tech stack.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 h-12 rounded-lg bg-[var(--cyan-500)] text-black font-semibold flex items-center justify-center gap-2 hover:bg-[var(--cyan-400)] transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Try Demo <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <button 
                className="w-full sm:w-auto px-8 h-12 rounded-lg border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] text-white font-medium flex items-center justify-center gap-2 transition-colors"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch How It Works <Play className="w-4 h-4 fill-current outline-none" strokeWidth={1} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[12px] text-[var(--text-muted)] font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-400)]"></span> 100+ MITRE Rules
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-400)]"></span> 5 Validation Engines
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-400)]"></span> Blockchain Anchored
              </span>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <AnimatedThreatGraph />
          </div>
        </div>
      </section>

      {/* SECTION B — LIVE DEMO PREVIEW (CIBIL Analogy) */}
      <section className="py-24 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-['Syne'] font-bold text-4xl text-white mb-6">Your Security Score — like your credit.</h2>
            <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed max-w-[500px]">
              Just as CIBIL turns your financial history into one trusted number, 
              QUANTUM-ARES turns your infrastructure design into a Security Index (0–100) 
              that every CISO, auditor, and regulator can understand and verify.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-8 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-default)] relative shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              {/* Card 1 */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <div className="font-['JetBrains_Mono'] text-4xl text-[var(--low)] font-bold mb-2">742<span className="text-xl text-[var(--text-muted)]">/900</span></div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">Financial Trustworthiness</div>
                <div className="text-[12px] text-[var(--text-muted)] mt-1">CIBIL Score</div>
              </div>
              
              {/* Arrow linking them visually for larger screens */}
              <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] items-center justify-center z-10">
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-xl border border-[var(--border-accent)] bg-[var(--critical-bg)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--critical)]"></div>
                <div className="font-['JetBrains_Mono'] text-4xl text-[var(--critical)] font-bold mb-2">28<span className="text-xl text-[var(--critical)] opacity-50">/100</span></div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">Infrastructure Security</div>
                <div className="text-[12px] text-[var(--text-muted)] mt-1">QUANTUM-ARES Security Index</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] text-center text-[13px] text-[var(--text-muted)]">
              Same concept. Different domain. <strong className="text-[var(--text-primary)] font-medium">Auditable by RBI & CERT-In.</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-[var(--bg-base)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-['Syne'] font-bold text-4xl text-white mb-4">How It Works</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">Four steps from raw config to board-ready report.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[1px] border-t border-dashed border-[var(--border-default)] z-0"></div>

            {[
              { num: '01', title: 'Upload', desc: 'Drop JSON / YAML / Terraform' },
              { num: '02', title: 'Graph', desc: 'We build a live topology of your entire system' },
              { num: '03', title: 'Score', desc: '5 engines score your design simultaneously' },
              { num: '04', title: 'Report', desc: 'Get a blockchain-anchored PDF your CISO can show regulators' },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center font-['JetBrains_Mono'] font-extrabold text-[var(--cyan-400)] text-xl mb-6 shadow-lg">
                  {step.num}
                </div>
                <h3 className="font-['Syne'] font-semibold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-[14px] text-[var(--text-secondary)] max-w-[200px] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D — INDIA IMPACT STATS */}
      <section className="py-24 bg-[var(--bg-surface)] border-b border-[var(--border-default)] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--critical)] opacity-[0.03] blur-[120px] rounded-full point-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-['Syne'] font-bold text-4xl text-white">The India Threat Reality</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8">
              <div className="font-['Syne'] font-extrabold text-5xl text-[var(--critical)] mb-3 tracking-tight">₹5,500 Cr</div>
              <div className="text-[14px] text-[var(--text-secondary)]">lost to infra-level breaches annually</div>
            </div>
            <div className="text-center p-8 md:border-x border-[var(--border-subtle)]">
              <div className="font-['Syne'] font-extrabold text-5xl text-[var(--critical)] mb-3 tracking-tight">₹360 Cr</div>
              <div className="text-[14px] text-[var(--text-secondary)]">in DPDP fines issued in Q1 2026 alone</div>
            </div>
            <div className="text-center p-8">
              <div className="font-['Syne'] font-extrabold text-5xl text-[var(--critical)] mb-3 tracking-tight">1.5M+</div>
              <div className="text-[14px] text-[var(--text-secondary)]">attacks per year targeting Indian infrastructure</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[18px] text-white font-medium mb-6">Don't be the next breach.</p>
            <Link 
              to="/login" 
              className="inline-flex px-10 h-14 rounded-xl bg-[var(--cyan-500)] text-black font-semibold items-center justify-center gap-2 hover:bg-[var(--cyan-400)] transition-colors shadow-[0_0_30px_rgba(6,182,212,0.25)] text-[16px]"
            >
              Validate Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION E — FOOTER */}
      <footer className="bg-[var(--bg-base)] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[var(--cyan-400)]" strokeWidth={1.5} />
                <span className="font-['Syne'] font-bold tracking-tight text-lg text-white">QUANTUM·ARES</span>
              </div>
              <p className="text-[14px] text-[var(--text-muted)] max-w-[250px]">
                Architecture is the new perimeter.
              </p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-[14px] text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">Security Engines</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-[14px] text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">DPDP 2023 Compliance</a></li>
                <li><a href="#" className="hover:text-[var(--cyan-400)] transition-colors">Contact Validation Team</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[var(--border-subtle)] text-center md:text-left text-[13px] text-[var(--text-muted)] flex flex-col md:flex-row justify-between items-center">
            <span>© 2026 QUANTUM-ARES. Ship Ready. All rights reserved.</span>
            <span className="mt-4 md:mt-0 font-['JetBrains_Mono'] text-[11px] bg-[var(--bg-surface)] px-2 py-1 border border-[var(--border-subtle)] rounded text-[var(--text-secondary)]">v7.75-PRODUCTION</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
