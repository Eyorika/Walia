import { Users, Award, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://waliabet.com/register?ref=WALIA50";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ─── Share Box ──────────────────────────────────────── */}
      <section className="glass-panel p-8 rounded-3xl border border-brand-border text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-primary/5 blur-[80px]"></div>
        <Share2 className="mx-auto text-brand-primary" size={40} />
        <h2 className="text-3xl font-display font-extrabold">Invite Friends & Earn Commission</h2>
        <p className="text-brand-muted max-w-lg mx-auto">
          Get 5% commission on all stakes made by players who sign up using your referral link.
        </p>

        <div className="flex items-center gap-2 max-w-md mx-auto bg-[#0D1117] p-2.5 rounded-xl border border-brand-border mt-6">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-transparent text-sm outline-none px-2 font-mono text-brand-muted"
          />
          <button onClick={handleCopy} className="bg-brand-primary text-black hover:bg-[#00e65e] font-bold px-4 py-2 rounded-lg text-sm transition">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </section>

      {/* ─── Statistics ─────────────────────────────────────── */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-[#161B22] p-6 rounded-2xl border border-brand-border text-center">
          <Users className="mx-auto text-sky-400 mb-2" size={24} />
          <h4 className="text-xs font-bold text-brand-muted uppercase">Total Signups</h4>
          <p className="text-2xl font-extrabold mt-1">12 Players</p>
        </div>
        <div className="bg-[#161B22] p-6 rounded-2xl border border-brand-border text-center">
          <Award className="mx-auto text-brand-accent mb-2" size={24} />
          <h4 className="text-xs font-bold text-brand-muted uppercase">Total Commision</h4>
          <p className="text-2xl font-extrabold mt-1 text-brand-accent">1,240.00 Birr</p>
        </div>
        <div className="bg-[#161B22] p-6 rounded-2xl border border-brand-border text-center">
          <Users className="mx-auto text-brand-primary mb-2" size={24} />
          <h4 className="text-xs font-bold text-brand-muted uppercase">Active Bettors</h4>
          <p className="text-2xl font-extrabold mt-1">8 Players</p>
        </div>
      </section>
    </div>
  );
}
