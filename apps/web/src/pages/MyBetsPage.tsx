import { Printer } from 'lucide-react';

const MOCK_BETS = [
  { id: 'BET-90812', type: 'Accumulator', stake: 200, potentialWin: 1240, status: 'won', date: '2026-07-06 14:20', odds: 6.20 },
  { id: 'BET-89127', type: 'Single', stake: 500, potentialWin: 950, status: 'open', date: '2026-07-07 10:15', odds: 1.90 },
];

export default function MyBetsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold">My Betting History</h2>

      <div className="space-y-4">
        {MOCK_BETS.map((bet) => (
          <div key={bet.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-xs text-brand-muted font-mono">{bet.id} • {bet.date}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{bet.type} Bet</span>
                  <span className={`text-xs uppercase px-2 py-0.5 rounded font-bold ${
                    bet.status === 'won' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {bet.status}
                  </span>
                </div>
              </div>
              <button className="bg-[#21262D] hover:bg-[#30363D] p-2.5 rounded-lg border border-[#30363D] transition">
                <Printer size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 bg-[#0D1117] p-4 rounded-xl text-sm border border-brand-border">
              <div>
                <span className="block text-brand-muted text-xs">Total Odds</span>
                <span className="font-mono font-bold">{bet.odds.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-brand-muted text-xs">Stake Amount</span>
                <span className="font-mono font-bold">{bet.stake} Birr</span>
              </div>
              <div>
                <span className="block text-brand-muted text-xs">Potential Payout</span>
                <span className="font-mono font-bold">{bet.potentialWin} Birr</span>
              </div>
              <div>
                <span className="block text-brand-muted text-xs">Payout Wallet</span>
                <span className="font-mono font-bold">Main</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
