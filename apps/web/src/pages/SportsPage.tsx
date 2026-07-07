import { useState } from 'react';
import { useBetSlipStore } from '../store/index.js';
import { Flame, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_MATCHES = [
  { id: '1', sport: 'Football', league: 'Ethiopian Premier League', home: 'Saint George SC', away: 'Ethiopian Coffee SC', time: 'Tonight 18:00', odds: { home: 2.10, draw: 3.20, away: 2.90 } },
  { id: '2', sport: 'Football', league: 'English Premier League', home: 'Arsenal FC', away: 'Chelsea FC', time: 'Tonight 22:00', odds: { home: 1.80, draw: 3.60, away: 3.80 } },
  { id: '3', sport: 'Football', league: 'Spanish La Liga', home: 'Real Madrid CF', away: 'FC Barcelona', time: 'Tomorrow 21:00', odds: { home: 2.05, draw: 3.50, away: 3.10 } },
  { id: '4', sport: 'Basketball', league: 'NBA', home: 'LA Lakers', away: 'Boston Celtics', time: 'Tomorrow 04:30', odds: { home: 1.95, draw: 0, away: 1.85 } }
];

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState<string>('Football');
  const addSelection = useBetSlipStore((s) => s.addSelection);

  const filteredMatches = MOCK_MATCHES.filter((m) => m.sport === selectedSport);

  const handleOddClick = (match: typeof MOCK_MATCHES[0], selection: 'home' | 'draw' | 'away', oddsValue: number) => {
    if (oddsValue === 0) return;
    addSelection({
      matchId: match.id,
      marketId: 'market-1',
      oddId: `${match.id}-${selection}`,
      matchName: `${match.home} vs ${match.away}`,
      marketName: 'Match Winner',
      selection: selection === 'home' ? match.home : selection === 'away' ? match.away : 'Draw',
      oddsValue,
    });
  };

  return (
    <div className="space-y-8">
      {/* ─── Category Selection ─────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['Football', 'Basketball', 'Tennis', 'Volleyball'].map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-6 py-3 rounded-xl font-bold transition whitespace-nowrap text-sm ${
              selectedSport === sport
                ? 'gold-gradient text-black'
                : 'bg-[#161B22] text-brand-text border border-brand-border hover:border-brand-primary'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* ─── Match List ─────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-extrabold flex items-center gap-2">
          <Flame className="text-brand-primary" size={20} />
          Today's {selectedSport} Schedule
        </h3>

        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-primary/30 transition">
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-muted uppercase bg-[#21262D] px-2.5 py-1 rounded">{match.league}</span>
                <div className="flex items-center gap-4">
                  <Link to={`/app/match/${match.id}`} className="text-lg font-bold hover:text-brand-primary transition">
                    {match.home} <span className="text-brand-muted text-sm px-1">vs</span> {match.away}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-muted font-mono">
                  <Clock size={12} />
                  <span>{match.time}</span>
                </div>
              </div>

              {/* Odds Buttons Block */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleOddClick(match, 'home', match.odds.home)}
                  className="bg-[#0D1117] hover:border-brand-primary border border-brand-border px-4 py-2.5 rounded-xl w-24 text-center transition"
                >
                  <span className="block text-[10px] text-brand-muted font-bold">1</span>
                  <span className="font-mono text-brand-primary font-bold">{match.odds.home.toFixed(2)}</span>
                </button>
                {match.odds.draw > 0 && (
                  <button
                    onClick={() => handleOddClick(match, 'draw', match.odds.draw)}
                    className="bg-[#0D1117] hover:border-brand-primary border border-brand-border px-4 py-2.5 rounded-xl w-24 text-center transition"
                  >
                    <span className="block text-[10px] text-brand-muted font-bold">X</span>
                    <span className="font-mono text-brand-primary font-bold">{match.odds.draw.toFixed(2)}</span>
                  </button>
                )}
                <button
                  onClick={() => handleOddClick(match, 'away', match.odds.away)}
                  className="bg-[#0D1117] hover:border-brand-primary border border-brand-border px-4 py-2.5 rounded-xl w-24 text-center transition"
                >
                  <span className="block text-[10px] text-brand-muted font-bold">2</span>
                  <span className="font-mono text-brand-primary font-bold">{match.odds.away.toFixed(2)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
