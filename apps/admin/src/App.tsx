import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.js';
import UserManagement from './pages/UserManagement.js';
import MatchesManagement from './pages/MatchesManagement.js';
import OddsManagement from './pages/OddsManagement.js';
import TransactionsManagement from './pages/TransactionsManagement.js';
import SystemLogs from './pages/SystemLogs.js';
import { LayoutDashboard, Users, Trophy, Percent, Wallet, ShieldAlert, LogOut } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🇪🇹</span>
          <span className="font-display font-extrabold text-2xl tracking-wider text-white">
            WALIA<span className="text-brand-primary">BET</span> <span className="text-xs uppercase bg-red-500/20 text-red-500 px-2 py-0.5 rounded font-mono font-bold tracking-normal">Admin</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-red-400 hover:text-red-500 transition flex items-center gap-1.5 text-sm font-semibold"
        >
          <LogOut size={16} /> Exit Panel
        </button>
      </header>

      <div className="flex flex-1 relative">
        {/* ─── Sidebar Navigation ────────────────────────────── */}
        <aside className="w-64 border-r border-[#30363D] bg-[#161B22]/50 p-6 space-y-6 shrink-0 hidden md:block">
          <div className="space-y-1">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Management</p>
            <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Overview Dashboard" />
            <SidebarLink to="/users" icon={<Users size={18} />} label="User Accounts" />
            <SidebarLink to="/matches" icon={<Trophy size={18} />} label="Sports Matches" />
            <SidebarLink to="/odds" icon={<Percent size={18} />} label="Odds Management" />
            <SidebarLink to="/transactions" icon={<Wallet size={18} />} label="Wallet Transactions" />
            <SidebarLink to="/logs" icon={<ShieldAlert size={18} />} label="System Audit Logs" />
          </div>
        </aside>

        {/* ─── Viewport ──────────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/matches" element={<MatchesManagement />} />
            <Route path="/odds" element={<OddsManagement />} />
            <Route path="/transactions" element={<TransactionsManagement />} />
            <Route path="/logs" element={<SystemLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-text hover:bg-[#21262D] hover:text-white transition font-medium text-sm">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
