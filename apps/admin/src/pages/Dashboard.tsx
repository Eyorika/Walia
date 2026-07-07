import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_DATA = [
  { name: 'Mon', revenue: 40000, profit: 24000 },
  { name: 'Tue', revenue: 30000, profit: 13980 },
  { name: 'Wed', revenue: 20000, profit: 9800 },
  { name: 'Thu', revenue: 27800, profit: 3908 },
  { name: 'Fri', revenue: 18900, profit: 4800 },
  { name: 'Sat', revenue: 23900, profit: 3800 },
  { name: 'Sun', revenue: 34900, profit: 4300 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* ─── Metric Summaries ──────────────────────────────── */}
      <section className="grid md:grid-cols-4 gap-6">
        <MetricCard title="Gross Stakes" value="1,240,500 Birr" change="+12.5%" positive={true} />
        <MetricCard title="Net Profit" value="384,100 Birr" change="+8.3%" positive={true} />
        <MetricCard title="Active Bettors" value="1,840 Users" change="+24.1%" positive={true} />
        <MetricCard title="Pending Payouts" value="94,200 Birr" change="-4.1%" positive={false} />
      </section>

      {/* ─── Recharts Area Plot ──────────────────────────────── */}
      <section className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
            <TrendingUp className="text-brand-primary" size={20} /> Financial Performance
          </h3>
          <span className="text-xs text-brand-muted font-bold uppercase">Last 7 Days (ETB)</span>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C851" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00C851" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB800" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="name" stroke="#8B949E" />
              <YAxis stroke="#8B949E" />
              <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#00C851" fillOpacity={1} fill="url(#colorRev)" name="Stakes" />
              <Area type="monotone" dataKey="profit" stroke="#FFB800" fillOpacity={1} fill="url(#colorProfit)" name="Profits" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, change, positive }: { title: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-2 relative overflow-hidden">
      <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-display font-extrabold">{value}</h3>
      <div className="flex items-center gap-1.5 pt-1">
        {positive ? (
          <ArrowUpRight className="text-brand-primary" size={14} />
        ) : (
          <ArrowDownRight className="text-red-400" size={14} />
        )}
        <span className={`text-xs font-bold ${positive ? 'text-brand-primary' : 'text-red-400'}`}>{change}</span>
        <span className="text-[10px] text-brand-muted font-bold">vs last week</span>
      </div>
    </div>
  );
}
