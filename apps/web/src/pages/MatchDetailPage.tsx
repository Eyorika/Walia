import { useParams } from 'react-router-dom';
import { useBetSlipStore } from '../store/index.js';
import { LineChart } from 'lucide-react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const addSelection = useBetSlipStore((s) => s.addSelection);

  // Mock details
  const match = {
    id: id || '1',
    league: 'Ethiopian Premier League',
    home: 'Saint George SC',
    away: 'Ethiopian Coffee SC',
    stadium: 'Addis Ababa Stadium',
    time: 'Tonight 18:00',
  };

  const handleSelection = (market: string, selection: string, odds: number) => {
    addSelection({
      matchId: match.id,
      marketId: market.toLowerCase().replace(/ /g, '-'),
      oddId: `${match.id}-${market}-${selection}`,
      matchName: `${match.home} vs ${match.away}`,
      marketName: market,
      selection,
      oddsValue: odds,
    });
  };

  return (
    <div className="space-y-8">
      {/* ─── Match Banner header ────────────────────────────── */}
      <section className="glass-panel p-8 rounded-3xl border border-brand-border text-center space-y-4 relative overflow-hidden">
        <span className="bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-full text-xs font-semibold uppercase">{match.league}</span>
        <div className="flex justify-center items-center gap-12 py-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#21262D] rounded-full mx-auto flex items-center justify-center text-3xl">🛡️</div>
            <h2 className="text-2xl font-bold font-display">{match.home}</h2>
          </div>
          <span className="text-2xl font-black text-brand-muted">VS</span>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#21262D] rounded-full mx-auto flex items-center justify-center text-3xl">☕</div>
            <h2 className="text-2xl font-bold font-display">{match.away}</h2>
          </div>
        </div>
        <p className="text-sm text-brand-muted">{match.stadium} • {match.time}</p>
      </section>

      {/* ─── Markets Grid ───────────────────────────────────── */}
      <section className="space-y-6">
        <h3 className="text-xl font-display font-extrabold flex items-center gap-2">
          <LineChart size={20} className="text-brand-primary" /> Betting Markets
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <MarketRow
            title="Match Winner (1X2)"
            selections={[
              { label: ' Saint George SC', odd: 2.10, action: () => handleSelection('1X2', match.home, 2.10) },
              { label: 'Draw', odd: 3.20, action: () => handleSelection('1X2', 'Draw', 3.20) },
              { label: 'Ethiopian Coffee', odd: 2.90, action: () => handleSelection('1X2', match.away, 2.90) }
            ]}
          />
          <MarketRow
            title="Double Chance"
            selections={[
              { label: 'Home or Draw', odd: 1.35, action: () => handleSelection('Double Chance', 'Home/Draw', 1.35) },
              { label: 'Home or Away', odd: 1.28, action: () => handleSelection('Double Chance', 'Home/Away', 1.28) },
              { label: 'Draw or Away', odd: 1.55, action: () => handleSelection('Double Chance', 'Draw/Away', 1.55) }
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function MarketRow({ title, selections }: { title: string; selections: { label: string; odd: number; action: () => void }[] }) {
  return (
    <div className="bg-[#161B22] p-6 rounded-2xl border border-brand-border space-y-3">
      <h4 className="font-bold text-sm text-brand-muted uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {selections.map((sel, idx) => (
          <button
            key={idx}
            onClick={sel.action}
            className="bg-[#0D1117] hover:border-brand-primary border border-brand-border p-3 rounded-xl transition text-center"
          >
            <span className="block text-xs text-brand-muted truncate mb-1">{sel.label}</span>
            <span className="font-mono text-brand-primary font-bold">{sel.odd.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
