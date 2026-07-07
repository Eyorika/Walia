import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';
import { Mail, User, Phone, Lock } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setError('You must agree to the Terms & Conditions');
      return;
    }

    setAuth('mock-token-jwt', {
      id: 'user-new',
      email,
      username,
      role: 'customer'
    });
    navigate('/app/dashboard');
  };

  return (
    <div className="max-w-md mx-auto my-6 glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-extrabold">Open Wallet</h2>
        <p className="text-sm text-brand-muted">Join WaliaBet and start sports betting instantly</p>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-brand-muted" size={18} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
              placeholder="username123"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-brand-muted" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
              placeholder="e.g. name@domain.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-brand-muted" size={18} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 pl-10 pr-4 focus:border-brand-primary focus:outline-none"
              placeholder="0911223344"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Create Password</label>
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

        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="rounded bg-brand-dark border-brand-border" />
          <span>I agree to the Terms of Service & Age requirement (18+)</span>
        </div>

        <button type="submit" className="w-full gold-gradient text-black font-extrabold py-3.5 rounded-xl text-lg hover:opacity-95 transition shadow-lg shadow-brand-accent/15">
          Register & Get Welcome Bonus
        </button>
      </form>

      <p className="text-center text-sm text-brand-muted">
        Already have an account? <Link to="/login" className="text-brand-primary hover:underline font-semibold">Login instead</Link>
      </p>
    </div>
  );
}
