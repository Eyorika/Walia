import { useState } from 'react';
import { Trophy, Calendar, Plus, RefreshCw } from 'lucide-react';

const MOCK_MATCHES = [
  { id: '1', home: 'Saint George SC', away: 'Ethiopian Coffee SC', league: 'Ethiopian Premier League', time: '2026-07-07 18:00', status: 'scheduled', score: 'vs' },
  { id: '2', home: 'Arsenal FC', away: 'Chelsea FC', league: 'English Premier League', time: '2026-07-07 22:00', status: 'live', score: '1 - 0 (42\')' },
  { id: '3', home: 'Real Madrid CF', away: 'FC Barcelona', league: 'Spanish La Liga', time: '2026-07-08 21:00', status: 'scheduled', score: 'vs' },
];

export default function MatchesManagement() {
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('Ethiopian Premier League');
  const [time, setTime] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newMatch = {
      id: String(matches.length + 1),
      home: homeTeam,
      away: awayTeam,
      league,
      time: time.replace('T', ' '),
      status: 'scheduled',
      score: 'vs'
    };
    setMatches([...matches, newMatch]);
    setShowModal(false);
    setHomeTeam('');
    setAwayTeam('');
    setTime('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-extrabold flex items-center gap-2">
          <Trophy className="text-brand-primary" size={28} /> Sports Matches
        </h2>
        <button onClick={() => setShowModal(true)} className="gold-gradient text-black font-extrabold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:scale-[1.02] transition">
          <Plus size={16} /> Create Match Event
        </button>
      </div>

      {/* Matches Grid List */}
      <div className="grid md:grid-cols-2 gap-6">
        {matches.map((m) => (
          <div key={m.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
            <div className="flex justify-between text-xs text-brand-muted font-bold">
              <span>{m.league}</span>
              <span className="font-mono">{m.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{m.home}</span>
              <span className="bg-[#21262D] px-3 py-1.5 rounded-lg font-mono font-bold text-brand-accent border border-brand-border">{m.score}</span>
              <span className="font-bold text-lg text-right">{m.away}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                m.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-brand-border text-brand-muted'
              }`}>{m.status}</span>
              <button className="text-xs text-brand-primary hover:underline font-bold">Manage Results</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Match Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-brand-border w-full max-w-md p-8 rounded-2xl space-y-6">
            <h3 className="text-2xl font-display font-extrabold">Schedule Match Event</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-brand-muted font-bold uppercase">Home Team</span>
                <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none focus:border-brand-primary" required />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-brand-muted font-bold uppercase">Away Team</span>
                <input type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none focus:border-brand-primary" required />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-brand-muted font-bold uppercase">League / Competition</span>
                <select value={league} onChange={(e) => setLeague(e.target.value)} className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none">
                  <option>Ethiopian Premier League</option>
                  <option>English Premier League</option>
                  <option>Spanish La Liga</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-brand-muted font-bold uppercase">Kickoff Time</span>
                <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none focus:border-brand-primary" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-[#21262D] border border-brand-border py-2.5 rounded-lg text-sm transition">Cancel</button>
                <button type="submit" className="flex-1 gold-gradient text-black font-extrabold py-2.5 rounded-lg text-sm transition">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
