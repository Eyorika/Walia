import { useBetSlipStore } from '../store/index.js';
import { X, Trash2, ShieldCheck, Check } from 'lucide-react';
import { useState } from 'react';

export default function BetSlip() {
  const { selections, stake, betType, useBonus, removeSelection, clearSlip, setStake, toggleBonus } = useBetSlipStore();
  const [success, setSuccess] = useState('');

  if (selections.length === 0) return null;

  const totalOdds = selections.reduce((acc, s) => acc * s.oddsValue, 1);
  const potentialWin = stake * totalOdds;

  const handlePlaceBet = () => {
    setSuccess(`Bet placed successfully! Pot. Win: ${potentialWin.toFixed(2)} Birr.`);
    setTimeout(() => {
      clearSlip();
      setSuccess('');
    }, 3000);
  };

  return (
    <aside className="w-80 border-l border-brand-border bg-[#161B22] p-6 shrink-0 flex flex-col h-[calc(100vh-73px)] sticky top-[73px]">
      <div className="flex justify-between items-center pb-4 border-b border-brand-border">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
          🎟️ Bet Slip <span className="bg-brand-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">{selections.length}</span>
        </h3>
        <button onClick={clearSlip} className="text-brand-muted hover:text-red-400 transition">
          <Trash2 size={16} />
        </button>
      </div>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 bg-brand-primary/20 text-brand-primary rounded-full flex items-center justify-center">
            <Check size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white">Bet Confirmed</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">{success}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Selections List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {selections.map((sel) => (
              <div key={sel.oddId} className="bg-[#0D1117] p-3 rounded-lg border border-brand-border relative space-y-1">
                <button onClick={() => removeSelection(sel.oddId)} className="absolute right-2 top-2 text-brand-muted hover:text-white transition">
                  <X size={14} />
                </button>
                <span className="block text-[10px] font-bold text-brand-primary uppercase">{sel.marketName}</span>
                <span className="block text-sm font-bold truncate pr-6">{sel.selection}</span>
                <div className="flex justify-between items-center text-xs text-brand-muted pt-1">
                  <span className="truncate pr-2">{sel.matchName}</span>
                  <span className="font-mono font-bold text-white">{sel.oddsValue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculations Summary */}
          <div className="pt-4 border-t border-brand-border space-y-4">
            {selections.length > 1 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted">Combined Odds</span>
                <span className="font-mono font-bold text-brand-accent">{totalOdds.toFixed(2)}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-brand-muted">
                <span>STAKE AMOUNT</span>
                <span>Pot. Win: {potentialWin.toFixed(2)} Birr</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0D1117] border border-brand-border rounded-lg py-2.5 px-3 font-mono font-bold text-white outline-none focus:border-brand-primary"
                  min="10"
                />
                <span className="absolute right-3 top-2.5 text-xs text-brand-muted">Birr</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-brand-accent" /> Use Bonus Balance
              </span>
              <input type="checkbox" checked={useBonus} onChange={toggleBonus} className="rounded" />
            </div>

            <button onClick={handlePlaceBet} className="w-full gold-gradient text-black font-extrabold py-3 rounded-xl transition text-sm">
              Place {betType === 'accumulator' ? 'Accumulator' : 'Single'} Bet
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
