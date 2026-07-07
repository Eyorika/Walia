import { Award, Wallet, Clock, Play, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ─── Balance Banner ─────────────────────────────────── */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-bold">Wallet Balance</p>
            <h3 className="text-3xl font-display font-extrabold text-white">0.00 <span className="text-brand-primary text-xl">ETB</span></h3>
          </div>
          <Wallet size={36} className="text-brand-primary opacity-80" />
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-bold">Active Bonus</p>
            <h3 className="text-3xl font-display font-extrabold text-brand-accent">500.00 <span className="text-brand-accent text-xl">ETB</span></h3>
          </div>
          <Award size={36} className="text-brand-accent opacity-80" />
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-brand-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-bold">Active Bets</p>
            <h3 className="text-3xl font-display font-extrabold text-white">0 <span className="text-brand-muted text-xl">Bets</span></h3>
          </div>
          <Clock size={36} className="text-brand-muted opacity-80" />
        </div>
      </section>

      {/* ─── Fast Actions ───────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/app/wallet" className="bg-[#161B22] p-4 rounded-xl border border-brand-border text-center hover:border-brand-primary transition">
          <ArrowUpRight className="mx-auto text-brand-primary mb-2" size={24} />
          <span className="font-semibold text-sm">Deposit Funds</span>
        </Link>
        <Link to="/app/sports" className="bg-[#161B22] p-4 rounded-xl border border-brand-border text-center hover:border-brand-primary transition">
          <Play className="mx-auto text-brand-primary mb-2" size={24} />
          <span className="font-semibold text-sm">Live Markets</span>
        </Link>
        <Link to="/app/referrals" className="bg-[#161B22] p-4 rounded-xl border border-brand-border text-center hover:border-brand-primary transition">
          <ShieldCheck className="mx-auto text-brand-primary mb-2" size={24} />
          <span className="font-semibold text-sm">Referral Code</span>
        </Link>
        <Link to="/app/support" className="bg-[#161B22] p-4 rounded-xl border border-brand-border text-center hover:border-brand-primary transition">
          <HelpCircle className="mx-auto text-brand-primary mb-2" size={24} />
          <span className="font-semibold text-sm">Contact Help</span>
        </Link>
      </section>

      {/* ─── Highlights Match Section ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-display font-extrabold">⚽ Popular Matches Today</h3>
          <Link to="/app/sports" className="text-brand-primary hover:underline text-sm font-semibold">View all matches</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <MatchOddsCard
            league="Ethiopian Premier League"
            home="Saint George SC"
            away="Ethiopian Coffee SC"
            time="Tonight 18:00"
            odds={{ home: 2.10, draw: 3.20, away: 2.90 }}
          />
          <MatchOddsCard
            league="English Premier League"
            home="Arsenal FC"
            away="Chelsea FC"
            time="Tonight 22:00"
            odds={{ home: 1.80, draw: 3.60, away: 3.80 }}
          />
        </div>
      </section>
    </div>
  );
}

function MatchOddsCard({ league, home, away, time, odds }: { league: string; home: string; away: string; time: string; odds: { home: number; draw: number; away: number } }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4 hover:border-brand-border/80 transition">
      <div className="flex justify-between text-xs text-brand-muted font-bold">
        <span>{league}</span>
        <span>{time}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-display font-bold text-lg">{home}</span>
        <span className="text-xs text-brand-muted">vs</span>
        <span className="font-display font-bold text-lg text-right">{away}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="bg-[#0D1117] hover:border-brand-primary border border-brand-border py-2.5 rounded-lg text-center transition">
          <div className="text-[10px] text-brand-muted font-bold">1</div>
          <div className="font-mono text-brand-primary font-bold">{odds.home.toFixed(2)}</div>
        </button>
        <button className="bg-[#0D1117] hover:border-brand-primary border border-brand-border py-2.5 rounded-lg text-center transition">
          <div className="text-[10px] text-brand-muted font-bold">X</div>
          <div className="font-mono text-brand-primary font-bold">{odds.draw.toFixed(2)}</div>
        </button>
        <button className="bg-[#0D1117] hover:border-brand-primary border border-brand-border py-2.5 rounded-lg text-center transition">
          <div className="text-[10px] text-brand-muted font-bold">2</div>
          <div className="font-mono text-brand-primary font-bold">{odds.away.toFixed(2)}</div>
        </button>
      </div>
    </div>
  );
}
