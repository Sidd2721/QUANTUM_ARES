import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Shield, Eye, EyeOff, Loader2, Workflow, Award, Database } from 'lucide-react';
import axios from 'axios';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      localStorage.setItem('qa_token', res.data.access_token);
      navigate('/dashboard/upload');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-[var(--text-primary)] font-['DM_Sans']">
      
      {/* Left Panel - Brand (45%) */}
      <div 
        className="hidden lg:flex w-[45%] bg-[var(--bg-surface)] flex-col justify-center px-16 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(34,211,238,0.05) 0%, transparent 50%), radial-gradient(rgba(148,163,184,0.1) 1px, transparent 1px)', backgroundSize: '100% 100%, 20px 20px' }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[var(--cyan-400)]" strokeWidth={1.5} />
            <span className="font-['Syne'] font-bold text-2xl tracking-tight text-white">QUANTUM·ARES</span>
          </div>
          
          <p className="font-light italic text-[18px] text-[var(--text-secondary)] mb-12">
            "Architecture is the new perimeter."
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4 border-l-2 border-[var(--cyan-400)] pl-4">
              <div className="mt-0.5"><Shield className="w-5 h-5 text-[var(--cyan-400)]" /></div>
              <div>
                <h4 className="font-semibold text-[15px] text-white">Zero-Trust Validation</h4>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">NIST SP 800-207 topology checks</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-l-2 border-[var(--cyan-400)] pl-4 opacity-80">
              <div className="mt-0.5"><Zap className="w-5 h-5 text-[var(--cyan-400)]" /></div>
              <div>
                <h4 className="font-semibold text-[15px] text-white">Quantum Risk (HNDL)</h4>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">NIST FIPS 203 Cryptography mapping</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-l-2 border-[var(--cyan-400)] pl-4 opacity-80">
              <div className="mt-0.5"><Database className="w-5 h-5 text-[var(--cyan-400)]" /></div>
              <div>
                <h4 className="font-semibold text-[15px] text-white">Blockchain Reports</h4>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">RSA-2048 + SHA-256 signatures</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-l-2 border-[var(--cyan-400)] pl-4 opacity-80">
              <div className="mt-0.5"><Award className="w-5 h-5 text-[var(--cyan-400)]" /></div>
              <div>
                <h4 className="font-semibold text-[15px] text-white">DPDP 2023 & RBI Compliant</h4>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">Automated regulatory bridging</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-16 right-16 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-4">
          Secured with AES-256 + RSA-2048. Zero external dependencies in air-gap mode.
        </div>
      </div>

      {/* Right Panel - Form (55%) */}
      <div className="w-full lg:w-[55%] bg-white flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <h2 className="font-['Syne'] font-bold text-[32px] text-[#0A0E1A] mb-2 text-center lg:text-left">
            Welcome Back
          </h2>
          <p className="text-[14px] text-[#64748B] mb-10 text-center lg:text-left">
            Sign in to your QUANTUM-ARES workspace.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={`w-full h-12 px-4 rounded-xl border bg-white text-[#0A0E1A] text-[16px] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#06B6D4] focus:ring-4 focus:ring-[#06B6D4]/10 ${error ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                placeholder="admin@demo.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-[#374151]">Password</label>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={`w-full h-12 pl-4 pr-12 rounded-xl border bg-white text-[#0A0E1A] text-[16px] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#06B6D4] focus:ring-4 focus:ring-[#06B6D4]/10 ${error ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-[13px] font-medium border-l-2 border-red-500 pl-2">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0A0E1A] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-[#0A0E1A]/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-[#E5E7EB]">
            <p className="text-[13px] text-[#64748B] mb-3">
              Don't have an account? Sign up
            </p>
            <Link to="/" className="text-[13px] font-medium text-[var(--cyan-600)] hover:text-[var(--cyan-500)] underline underline-offset-4 decoration-transparent hover:decoration-[var(--cyan-500)] transition-all">
              Learn more about QUANTUM-ARES &rarr;
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
