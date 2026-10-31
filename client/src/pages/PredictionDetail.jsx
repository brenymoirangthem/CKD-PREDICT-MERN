import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, Trash2, Sparkles, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api.js';
import Gauge from '../components/Gauge.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import { GROUPS } from '../utils/fields.js';

export default function PredictionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  useEffect(() => { api.get(`/predictions/${id}`).then((r) => setD(r.data)).catch((e) => { toast.error(errMsg(e)); nav('/history'); }); }, [id]);
  if (!d) return <p className="text-slate-400">Loading…</p>;

  const download = async () => {
    try {
      const { data } = await api.get(`/predictions/${id}/report`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(data); a.download = `CKD-report-${d.patientName}.pdf`; a.click();
    } catch (e) { toast.error('Could not download report'); }
  };
  const remove = async () => {
    if (!confirm('Delete this screening?')) return;
    await api.delete(`/predictions/${id}`); toast.success('Deleted'); nav('/history');
  };
  const labels = Object.fromEntries(GROUPS.flatMap((g) => g.fields).map((f) => [f.k, f.l]));
  const ex = d.explanation.map((e) => ({ name: e.label, impact: +(e.impact * 100).toFixed(2) }));

  return (
    <div className="space-y-6">
      <Link to="/history" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"><ArrowLeft size={14} /> Back</Link>
      {d.dataSource?.includes('SYNTHETIC') && <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">⚠ The model was trained on SYNTHETIC demo data. Train on the real UCI dataset before trusting results.</div>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card text-center lg:col-span-1">
          <h2 className="text-xl font-semibold">{d.patientName}</h2>
          <p className="mb-4 text-xs text-slate-500">{new Date(d.createdAt).toLocaleString()}</p>
          <Gauge probability={d.probability} risk={d.risk} />
          <div className="mt-4 flex justify-center"><RiskBadge risk={d.risk} /></div>
          <p className={`mt-3 text-sm ${d.flagged ? 'text-red-400' : 'text-green-400'}`}>{d.flagged ? 'Flagged: refer for nephrology work-up' : 'Below referral threshold'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn" onClick={download}><Download size={16} /> PDF report</button>
            <button className="btn-ghost text-red-400" onClick={remove}><Trash2 size={16} /></button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Model: {d.modelName}</p>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-1 font-semibold">Why this result?</h3>
          <p className="mb-2 text-xs text-slate-400">Change in CKD probability (percentage points) versus a typical patient. Red raises risk, blue lowers it.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ex} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" stroke="#64748b" fontSize={12} /><YAxis type="category" dataKey="name" width={150} stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} /><ReferenceLine x={0} stroke="#475569" />
              <Bar dataKey="impact" radius={4}>{ex.map((e, i) => <Cell key={i} fill={e.impact > 0 ? '#ef4444' : '#3b82f6'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {d.summary && (
        <div className="card border-teal-500/30">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-teal-300"><Sparkles size={16} /> AI summary (Gemini)</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{d.summary}</p>
        </div>
      )}
      <div className="card">
        <h3 className="mb-3 font-semibold">Entered values</h3>
        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(d.record).filter(([, v]) => v !== '' && v != null).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-white/5 py-1"><span className="text-slate-400">{labels[k] || k}</span><span>{String(v)}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
