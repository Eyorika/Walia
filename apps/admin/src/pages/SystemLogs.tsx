import { ShieldAlert } from 'lucide-react';

const MOCK_LOGS = [
  { id: '1', level: 'info', service: 'waliabet-api', message: '🚀 Express server running on port 4000', time: '2026-07-07 16:24:30' },
  { id: '2', level: 'info', service: 'waliabet-api', message: '🔑 User session generated for user-id-123', time: '2026-07-07 16:25:02' },
  { id: '3', level: 'warn', service: 'waliabet-api', message: '⚠️ Slow DB query queryOne: SELECT FROM matches', time: '2026-07-07 16:26:12' },
  { id: '4', level: 'error', service: 'waliabet-api', message: '🛑 Error: Telebirr endpoint returned 504 Gateway Timeout', time: '2026-07-07 16:28:15' },
];

export default function SystemLogs() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold flex items-center gap-2">
        <ShieldAlert className="text-brand-accent" size={28} /> System Audit Logs
      </h2>

      {/* Terminal logs list */}
      <div className="bg-[#0D1117] border border-brand-border rounded-2xl p-6 font-mono text-sm leading-relaxed space-y-4 max-h-[500px] overflow-y-auto">
        {MOCK_LOGS.map((log) => (
          <div key={log.id} className="flex gap-4 items-start">
            <span className="text-brand-muted shrink-0 select-none">[{log.time}]</span>
            <span className={`uppercase font-bold tracking-wider shrink-0 text-xs px-2 py-0.5 rounded ${
              log.level === 'error' ? 'bg-red-900/30 text-red-400' : log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-sky-400/20 text-sky-400'
            }`}>{log.level}</span>
            <span className="text-brand-muted shrink-0 font-bold">[{log.service}]:</span>
            <span className={log.level === 'error' ? 'text-red-300 font-bold' : log.level === 'warn' ? 'text-yellow-200' : 'text-brand-text'}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
