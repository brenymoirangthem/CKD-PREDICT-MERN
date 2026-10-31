import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, AlertTriangle, Gauge as GaugeIcon, Plus } from 'lucide-react';
import api from '../api.js';
import RiskBadge from '../components/RiskBadge.jsx';
import { RISK_COLOR } from '../utils/fields.js';

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className="rounded-xl p-3" style={{ background: `${color}22`, color }}><Icon /></div>
    <div><div className="text-2xl font-bold">{value}</div><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div></div>
  </div>
);

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/predictions/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p className="text-slate-400">Loading dashboard…</p>;
  const pie = s.byRisk.map((r) => ({ name: r._id, value: r.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-slate-400">Your screening activity at a glance</p></div>
        <Link to="/predict" className="btn"><Plus size={18} /> New screening</Link>
      </div>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">        <Stat icon={Users} label="Patients screened" value={s.total} color="#14b8a6" />
        <Stat icon={AlertTriangle} label="Flagged for referral" value={s.flagged} color="#ef4444" />
        <Stat icon={GaugeIcon} label="Average risk" value={`${(s.avgProbability * 100).toFixed(1)}%`} color="#6366f1" />
      </div>
      {s.total === 0 ? (
        <div className="card text-center text-slate-400">No screenings yet. <Link to="/predict" className="text-teal-400 hover:underline">Run your first one</Link>.</div>
      ) : (
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">          <div className="card">
            <h3 className="mb-2 font-semibold">Risk distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pie.map((p) => <Cell key={p.name} fill={RISK_COLOR[p.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs text-slate-400">{pie.map((p) => <span key={p.name}>● <span style={{ color: RISK_COLOR[p.name] }}>{p.name}</span> ({p.value})</span>)}</div>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold">Screenings (last 14 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.daily.map((d) => ({ day: d._id, count: d.count }))}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} /><YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card lg:col-span-2">
            <h3 className="mb-3 font-semibold">Recent screenings</h3>
            <div className="divide-y divide-white/10">
              {s.recent.map((r) => (
<Link
  key={r._id}
  to={`/prediction/${r._id}`}
  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-teal-300"
>                  <span>{r.patientName}</span>
                  <span className="flex items-center gap-3"><span className="text-sm text-slate-400">{(r.probability * 100).toFixed(1)}%</span><RiskBadge risk={r.risk} /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
