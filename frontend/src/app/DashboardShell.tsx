import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { BarChart2, Clock, Upload, FileText, LogOut, Bell, Moon } from 'lucide-react';

export function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('qa_token');
    navigate('/login');
  };

  // Compute a simple page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/upload')) return 'New Validation';
    if (path.includes('/overview')) return 'Security Overview';
    if (path.includes('/history')) return 'Scan History';
    if (path.includes('/reports')) return 'Generated Reports';
    if (path.includes('/scan/')) return 'Assessment Results';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] font-['DM_Sans'] overflow-hidden">
      
      {/* Sidebar (240px) */}
      <div className="w-[240px] flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-full z-20">
        
        {/* Top: Logo section */}
        <div className="h-[56px] flex items-center px-4 border-b border-[var(--border-subtle)] shrink-0 group hover:bg-[var(--bg-elevated)] transition-colors cursor-default">
          <div className="w-8 h-8 rounded bg-[var(--bg-elevated)] flex items-center justify-center font-['JetBrains_Mono'] font-bold text-[var(--cyan-400)] text-[15px] border border-[var(--border-default)] group-hover:border-[var(--border-accent)]">
            Q·A
          </div>
          <div className="ml-3 flex flex-col">
            <span className="font-['Syne'] font-semibold text-[14px] leading-tight text-white tracking-wide">QUANTUM-ARES</span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1 rounded w-fit mt-[2px]">v7.75-PROD</span>
          </div>
        </div>

        {/* Scan Status */}
        <div className="px-5 py-4 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--low)] animate-pulse"></span>
            <span>Last scan: 2 mins ago</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {[
            { to: '/dashboard/overview', icon: <BarChart2 className="w-4 h-4" strokeWidth={1.5} />, label: 'Overview' },
            { to: '/dashboard/history', icon: <Clock className="w-4 h-4" strokeWidth={1.5} />, label: 'History' },
            { to: '/dashboard/upload', icon: <Upload className="w-4 h-4" strokeWidth={1.5} />, label: 'Upload' },
            { to: '/dashboard/reports', icon: <FileText className="w-4 h-4" strokeWidth={1.5} />, label: 'Reports' },
          ].map((navItems) => (
            <NavLink
              key={navItems.to}
              to={navItems.to}
              className={({ isActive }) =>
                `flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] font-medium transition-all ${
                  isActive 
                  ? 'bg-[var(--cyan-glow)] border-l-[3px] border-[var(--cyan-400)] text-[var(--cyan-400)] rounded-l-sm' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-l-[3px] border-transparent'
                }`
              }
            >
              {navItems.icon}
              {navItems.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User Section */}
        <div className="h-14 shrink-0 border-t border-[var(--border-subtle)] px-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--cyan-400)] font-semibold text-[13px]">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-white leading-none">Admin</span>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">admin@demo.com</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-[var(--text-muted)] hover:text-[var(--critical)] transition-colors p-1.5 rounded hover:bg-[var(--critical-bg)]" title="Log out">
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)] relative overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-[56px] shrink-0 border-b border-[var(--border-subtle)] flex items-center justify-between px-8 bg-[var(--bg-base)]/80 backdrop-blur-md z-10">
          <h1 className="font-['Syne'] font-semibold text-[16px] text-white">
            {getPageTitle()}
          </h1>
          
          <div className="flex items-center gap-4">
            <button className="text-[var(--text-muted)] hover:text-white transition-colors" title="Toggle theme (not implemented)">
              <Moon className="w-4 h-4" />
            </button>
            <button className="text-[var(--text-muted)] hover:text-white transition-colors relative" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute 1 top-0 right-0 w-1.5 h-1.5 rounded-full bg-[var(--critical)]"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto relative w-full h-full">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}
