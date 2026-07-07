import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Mock log-in flow directly for verification demonstration
      if (email && password) {
        setAuth('mock-token-jwt', {
          id: 'user-id-123',
          email,
          username: email.split('@')[0],
          role: 'customer'
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
    <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-extrabold">Welcome Back</h2>
        <p className="text-sm text-brand-muted">Enter credentials to access your sports wallet</p>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-brand-muted" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
              placeholder="e.g. tariku@domain.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-brand-muted" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full green-gradient text-black font-extrabold py-3.5 rounded-xl text-lg hover:opacity-95 transition">
          {loading ? 'Logging in...' : 'Access Dashboard'}
        </button>
      </form>

      <p className="text-center text-sm text-brand-muted">
        Don't have an account? <Link to="/register" className="text-brand-primary hover:underline font-semibold">Register here</Link>
      </p>
    </div>
  );
}
