import { useState } from 'react';
import { Wallet, Smartphone, Landmark, Building2, Send, Check } from 'lucide-react';

export default function WalletPage() {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [provider, setProvider] = useState<'telebirr' | 'chapa' | 'mpesa' | 'cbe'>('telebirr');
  const [amount, setAmount] = useState('200');
  const [success, setSuccess] = useState('');

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(
      tab === 'deposit'
        ? `Successfully generated payment reference for ${amount} Birr via ${provider.toUpperCase()}`
        : `Successfully requested withdrawal of ${amount} Birr to your ${provider.toUpperCase()} account.`
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* ─── Tabs Toggle ────────────────────────────────────── */}
      <div className="grid grid-cols-2 bg-[#161B22] p-1.5 rounded-xl border border-brand-border">
        <button
          onClick={() => { setTab('deposit'); setSuccess(''); }}
          className={`py-3 rounded-lg font-bold text-sm transition ${tab === 'deposit' ? 'gold-gradient text-black' : 'text-brand-muted hover:text-white'}`}
        >
          Deposit Funds
        </button>
        <button
          onClick={() => { setTab('withdraw'); setSuccess(''); }}
          className={`py-3 rounded-lg font-bold text-sm transition ${tab === 'withdraw' ? 'gold-gradient text-black' : 'text-brand-muted hover:text-white'}`}
        >
          Withdraw Funds
        </button>
      </div>

      {success && (
        <div className="bg-brand-primary/20 border border-brand-primary/30 text-white p-4 rounded-xl flex items-start gap-3">
          <Check size={20} className="text-brand-primary shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* ─── Form Details ───────────────────────────────────── */}
      <form onSubmit={handleAction} className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Select Payment Provider</label>
          <div className="grid grid-cols-2 gap-4">
            <ProviderButton
              active={provider === 'telebirr'}
              onClick={() => setProvider('telebirr')}
              icon={<Smartphone className="text-sky-400" />}
              label="Telebirr"
            />
            <ProviderButton
              active={provider === 'chapa'}
              onClick={() => setProvider('chapa')}
              icon={<Landmark className="text-purple-400" />}
              label="Chapa"
            />
            <ProviderButton
              active={provider === 'mpesa'}
              onClick={() => setProvider('mpesa')}
              icon={<Smartphone className="text-green-500" />}
              label="M-Pesa"
            />
            <ProviderButton
              active={provider === 'cbe'}
              onClick={() => setProvider('cbe')}
              icon={<Building2 className="text-yellow-500" />}
              label="CBE Birr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Amount (Birr)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3.5 px-4 font-mono text-xl focus:border-brand-primary focus:outline-none"
            min="100"
            required
          />
          <span className="text-[10px] text-brand-muted">Min: 100 Birr | Max: 500,000 Birr</span>
        </div>

        <button type="submit" className="w-full green-gradient text-black font-extrabold py-4 rounded-xl text-lg hover:opacity-95 transition flex items-center justify-center gap-2">
          <Send size={18} />
          {tab === 'deposit' ? 'Initiate Deposit' : 'Request Withdrawal'}
        </button>
      </form>
    </div>
  );
}

function ProviderButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border transition text-left ${
        active ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-[#0D1117] hover:border-brand-primary'
      }`}
    >
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}
