import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/index.js';
import LandingPage from './pages/LandingPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import DashboardPage from './pages/DashboardPage.js';
import SportsPage from './pages/SportsPage.js';
import MatchDetailPage from './pages/MatchDetailPage.js';
import MyBetsPage from './pages/MyBetsPage.js';
import WalletPage from './pages/WalletPage.js';
import ReferralPage from './pages/ReferralPage.js';
import ProfilePage from './pages/ProfilePage.js';
import SupportPage from './pages/SupportPage.js';
import BetSlip from './components/BetSlip.js';
import { Menu, LogOut, Wallet, User as UserIcon, Ticket, Share2, Compass, Award, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function App() {
  const { token, user, logout } = useAuthStore();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className={`min-h-screen bg-brand-dark flex flex-col`}>
      {/* ─── Navigation Header ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">🇪🇹</span>
          <span className="font-display font-extrabold text-2xl tracking-wider text-white">
            WALIA<span className="text-brand-primary">BET</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <button onClick={toggleTheme} className="text-brand-muted hover:text-white transition">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {token ? (
            <div className="flex items-center gap-6">
              <Link to="/app/wallet" className="flex items-center gap-2 bg-[#21262D] hover:bg-[#30363D] transition px-4 py-2 rounded-lg border border-[#30363D]">
                <Wallet size={16} className="text-brand-primary" />
                <span className="font-semibold text-brand-primary">0.00 Birr</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{user?.username}</span>
                <span className="text-xs uppercase bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-mono">{user?.role}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-red-400 hover:text-red-500 transition flex items-center gap-1 text-sm font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-white hover:text-brand-primary transition font-medium">Login</Link>
              <Link to="/register" className="bg-brand-primary hover:bg-[#00e65e] transition text-black font-semibold px-4 py-2 rounded-lg">Register</Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Workspace & Sidebar ─────────────────────────── */}
      <div className="flex flex-1 relative">
        {token && (
          <aside className="w-64 border-r border-[#30363D] bg-[#161B22]/50 p-6 space-y-6 shrink-0 hidden md:block">
            <div className="space-y-1">
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Navigation</p>
              <SidebarLink to="/app/dashboard" icon={<Compass size={18} />} label="Dashboard" />
              <SidebarLink to="/app/sports" icon={<Award size={18} />} label="Sports Markets" />
              <SidebarLink to="/app/my-bets" icon={<Ticket size={18} />} label="My Bets" />
              <SidebarLink to="/app/wallet" icon={<Wallet size={18} />} label="Wallet Balance" />
              <SidebarLink to="/app/referrals" icon={<Share2 size={18} />} label="Referral Link" />
              <SidebarLink to="/app/profile" icon={<UserIcon size={18} />} label="My Profile" />
              <SidebarLink to="/app/support" icon={<Menu size={18} />} label="Support Tickets" />
            </div>
          </aside>
        )}

        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/sports" element={<SportsPage />} />
            <Route path="/app/match/:id" element={<MatchDetailPage />} />
            <Route path="/app/my-bets" element={<MyBetsPage />} />
            <Route path="/app/wallet" element={<WalletPage />} />
            <Route path="/app/referrals" element={<ReferralPage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/support" element={<SupportPage />} />
          </Routes>
        </main>

        {/* ─── Persistent BetSlip Drawer ────────────────────────── */}
        <BetSlip />
      </div>

      <footer className="bg-[#161B22] border-t border-[#30363D] py-6 text-center text-sm text-brand-muted mt-auto">
        <p>© 2026 WaliaBet. Responsible Gaming. Age limit 18+.</p>
      </footer>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-text hover:bg-[#21262D] hover:text-white transition font-medium text-sm">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
