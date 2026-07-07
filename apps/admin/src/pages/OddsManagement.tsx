import { useState } from 'react';
import { Percent, Edit, Save } from 'lucide-react';

const MOCK_ODDS = [
  { id: '1', match: 'Saint George SC vs Ethiopian Coffee SC', market: 'Match Winner (1X2)', outcome: 'Saint George SC', odds: 2.10 },
  { id: '2', match: 'Saint George SC vs Ethiopian Coffee SC', market: 'Match Winner (1X2)', outcome: 'Draw', odds: 3.20 },
  { id: '3', match: 'Saint George SC vs Ethiopian Coffee SC', market: 'Match Winner (1X2)', outcome: 'Ethiopian Coffee SC', odds: 2.90 },
  { id: '4', match: 'Arsenal FC vs Chelsea FC', market: 'Match Winner (1X2)', outcome: 'Arsenal FC', odds: 1.80 },
];

export default function OddsManagement() {
  const [oddsList, setOddsList] = useState(MOCK_ODDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (id: string, val: number) => {
    setEditingId(id);
    setTempValue(String(val));
  };

  const saveEdit = (id: string) => {
    setOddsList(oddsList.map(o => {
      if (o.id === id) {
        return { ...o, odds: parseFloat(tempValue) || o.odds };
      }
      return o;
    }));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold flex items-center gap-2">
        <Percent className="text-brand-primary" size={28} /> Odds Management
      </h2>

      {/* Odds Adjustment Table */}
      <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#161B22] border-b border-brand-border text-xs uppercase text-brand-muted font-bold">
              <th className="p-4">Match Event</th>
              <th className="p-4">Market</th>
              <th className="p-4">Selection Outcome</th>
              <th className="p-4">Current Odds</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-sm">
            {oddsList.map((item) => (
              <tr key={item.id} className="hover:bg-[#161B22]/40 transition">
                <td className="p-4 font-bold">{item.match}</td>
                <td className="p-4 text-brand-muted">{item.market}</td>
                <td className="p-4 font-semibold text-brand-accent">{item.outcome}</td>
                <td className="p-4 font-mono font-bold text-brand-primary">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="bg-[#0D1117] border border-brand-primary rounded px-2 py-1 w-20 text-white font-mono outline-none"
                    />
                  ) : (
                    item.odds.toFixed(2)
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  {editingId === item.id ? (
                    <button onClick={() => saveEdit(item.id)} className="bg-brand-primary text-black font-extrabold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition inline-flex items-center gap-1">
                      <Save size={12} /> Save
                    </button>
                  ) : (
                    <button onClick={() => startEdit(item.id, item.odds)} className="bg-[#21262D] border border-brand-border hover:bg-[#30363D] p-2 rounded-lg transition inline-flex items-center">
                      <Edit size={14} />
                    </button>
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
