import { useState } from 'react';
import { Wallet, Check, X } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'TXN-901', type: 'deposit', user: 'tariku_b', amount: 500, provider: 'telebirr', status: 'pending', date: '2026-07-07 14:10' },
  { id: 'TXN-902', type: 'withdrawal', user: 'kalkidan_g', amount: 1200, provider: 'cbe', status: 'pending', date: '2026-07-07 14:15' },
  { id: 'TXN-809', type: 'deposit', user: 'seife_a', amount: 1000, provider: 'chapa', status: 'completed', date: '2026-07-06 18:22' },
];

export default function TransactionsManagement() {
  const [txns, setTxns] = useState(MOCK_TRANSACTIONS);

  const handleAction = (id: string, success: boolean) => {
    setTxns(txns.map(t => {
      if (t.id === id) {
        return { ...t, status: success ? 'completed' : 'failed' };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold flex items-center gap-2">
        <Wallet className="text-brand-primary" size={28} /> Wallet Transactions
      </h2>

      {/* Transaction Records Table */}
      <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#161B22] border-b border-brand-border text-xs uppercase text-brand-muted font-bold">
              <th className="p-4">Reference</th>
              <th className="p-4">User</th>
              <th className="p-4">Action Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Gateway</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-sm">
            {txns.map((t) => (
              <tr key={t.id} className="hover:bg-[#161B22]/40 transition">
                <td className="p-4 font-mono font-bold">{t.id}</td>
                <td className="p-4">{t.user}</td>
                <td className="p-4">
                  <span className={`text-xs uppercase px-2 py-0.5 rounded font-bold font-mono ${
                    t.type === 'deposit' ? 'bg-sky-400/20 text-sky-400' : 'bg-pink-400/20 text-pink-400'
                  }`}>{t.type}</span>
                </td>
                <td className="p-4 font-mono font-bold">{t.amount} Birr</td>
                <td className="p-4 uppercase font-bold text-xs">{t.provider}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold uppercase ${
                    t.status === 'completed' ? 'text-brand-primary' : t.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{t.status}</span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {t.status === 'pending' ? (
                    <>
                      <button onClick={() => handleAction(t.id, true)} className="bg-brand-primary text-black font-extrabold p-1.5 rounded-lg hover:opacity-90 transition">
                        <Check size={14} />
                      </button>
                      <button onClick={() => handleAction(t.id, false)} className="bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded-lg hover:bg-red-500/30 transition">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-brand-muted font-bold font-mono">{t.date}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
