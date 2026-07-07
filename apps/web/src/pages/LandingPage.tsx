import { Link } from 'react-router-dom';
import { Award, Compass, Play, Shield, MessageSquare, Zap, BookOpen } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-20 max-w-6xl mx-auto py-10">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="text-center space-y-6 relative py-12">
        <div className="absolute inset-0 bg-brand-primary/10 blur-[120px] rounded-full max-w-lg mx-auto"></div>
        <span className="bg-[#FFB800]/10 text-brand-accent px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-[#FFB800]/20">
          🔥 Ethiopian Premier League Season Live
        </span>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-none">
          The Home of <span className="text-brand-primary">Sports Betting</span> in Ethiopia
        </h1>
        <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto">
          Fast deposits with Telebirr and CBE, high odds, instant payouts, and the best mobile app experience.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/register" className="gold-gradient text-black font-extrabold px-8 py-4 rounded-xl text-lg hover:scale-105 transition shadow-lg shadow-brand-accent/20">
            Join WaliaBet Now
          </Link>
          <Link to="/app/sports" className="bg-[#161B22] border border-brand-border text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-[#21262D] transition">
            Explore Match Odds
          </Link>
        </div>
      </section>

      {/* ─── Payment Partners ───────────────────────────────── */}
      <section className="glass-panel p-8 rounded-2xl border border-brand-border text-center space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-brand-muted">Supported Ethiopian Payment Gateways</h3>
        <div className="flex flex-wrap justify-center items-center gap-12 pt-4">
          <PaymentLogo name="Telebirr" color="text-sky-400" />
          <PaymentLogo name="Chapa" color="text-purple-400" />
          <PaymentLogo name="CBE Birr" color="text-yellow-500" />
          <PaymentLogo name="M-Pesa" color="text-green-500" />
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────── */}
      <section className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Zap size={32} className="text-brand-primary" />}
          title="Instant Telebirr Payouts"
          description="Cash out your winnings instantly. Directly sent to your Telebirr, CBE, or M-Pesa account."
        />
        <FeatureCard
          icon={<Shield size={32} className="text-brand-accent" />}
          title="100% Secure & Licensed"
          description="Enterprise-grade security using Supabase DB, SSL protection, and JWT auth to protect your deposits."
        />
        <FeatureCard
          icon={<Compass size={32} className="text-brand-primary" />}
          title="Telegram Bot Betting"
          description="Browse sports, view match centers, and place bets directly from inside Telegram using our official bot."
        />
      </section>

      {/* ─── FAQ ────────────────────────────────────────────── */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-display font-extrabold text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 pt-4">
          <FaqItem q="What is the minimum deposit?" a="The minimum deposit is 100 Birr via Telebirr, CBE, or Chapa." />
          <FaqItem q="How long do withdrawals take?" a="Withdrawals are processed instantly for Telebirr, and take up to 2 hours for standard bank accounts." />
          <FaqItem q="Can I place bets using Telegram?" a="Yes! Start our Telegram Bot using /start to link your wallet and place live bets instantly." />
        </div>
      </section>
    </div>
  );
}

function PaymentLogo({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2 font-display font-extrabold text-xl">
      <span className={color}>●</span> <span className="text-white opacity-80">{name}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-panel p-8 rounded-2xl space-y-4 border border-brand-border hover:border-brand-primary/50 transition duration-300">
      {icon}
      <h3 className="text-xl font-bold font-display">{title}</h3>
      <p className="text-brand-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-[#161B22] p-6 rounded-xl border border-brand-border space-y-2">
      <h4 className="font-bold text-lg text-white">{q}</h4>
      <p className="text-brand-muted text-sm">{a}</p>
    </div>
  );
}
