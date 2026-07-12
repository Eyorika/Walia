import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { Lock, Mail, Send } from 'lucide-react';

// Extend window for Telegram widget callback
declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const BOT_USERNAME = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'WaliaBetbot';
const AUTH_API = (import.meta as any).env?.VITE_AUTH_API_URL || '/auth/telegram';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  // ── Telegram Widget callback ───────────────────────────────
  const handleTelegramAuth = useCallback(async (tgUser: TelegramUser) => {
    setTgLoading(true);
    setError('');
    try {
      const res = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(tgUser.id),
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || '',
          username: tgUser.username || '',
          photo_url: tgUser.photo_url || '',
          auth_date: String(tgUser.auth_date),
          hash: tgUser.hash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Telegram authentication failed');
        return;
      }

      setAuth(data.token, data.user);
      navigate('/app/dashboard');
    } catch (err) {
      setError('Could not connect to auth server. Is the bot server running?');
    } finally {
      setTgLoading(false);
    }
  }, [setAuth, navigate]);

  // ── Inject Telegram widget script ─────────────────────────
  useEffect(() => {
    // Register global callback before script loads
    window.onTelegramAuth = handleTelegramAuth;

    const container = document.getElementById('telegram-login-container');
    if (!container || container.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?24';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    container.appendChild(script);

    return () => {
      // cleanup on unmount
      delete (window as any).onTelegramAuth;
    };
  }, [handleTelegramAuth]);

  // ── Email/Password submit (mock for now) ───────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (email && password) {
        setAuth('mock-token-jwt', {
          id: 'user-id-123',
          email,
          username: email.split('@')[0],
          role: 'customer',
        });
        navigate('/app/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-4">
      {/* ── Telegram Login Card ── */}
      <div className="glass-panel p-8 rounded-2xl border border-brand-border space-y-5">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Send size={28} className="text-[#229ED9]" />
            <h2 className="text-2xl font-display font-extrabold">Login with Telegram</h2>
          </div>
          <p className="text-sm text-brand-muted">
            One-tap login — no password required
          </p>
        </div>

        {tgLoading && (
          <div className="flex items-center justify-center gap-3 py-3 text-[#229ED9]">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm font-medium">Verifying Telegram identity…</span>
          </div>
        )}

        {!tgLoading && (
          <div className="flex justify-center">
            <div id="telegram-login-container" />
          </div>
        )}

        <p className="text-xs text-brand-muted text-center leading-relaxed">
          By logging in, you agree to our{' '}
          <a href="#" className="text-brand-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-brand-primary hover:underline">Privacy Policy</a>.
          WaliaBet is 18+ only.
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-xs text-brand-muted uppercase tracking-widest font-semibold">or</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      {/* ── Email/Password Card ── */}
      <div className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-display font-extrabold">Email Login</h2>
          <p className="text-sm text-brand-muted">Use your account credentials</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-brand-muted" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
                placeholder="e.g. tariku@domain.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-brand-muted" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full green-gradient text-black font-extrabold py-3.5 rounded-xl text-lg hover:opacity-95 transition"
          >
            {loading ? 'Logging in…' : 'Access Dashboard'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-primary hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
