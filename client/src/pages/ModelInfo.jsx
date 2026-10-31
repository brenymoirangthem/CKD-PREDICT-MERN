import { useEffect, useState } from 'react';
import api, { API, errMsg } from '../api.js';

const Table = ({ rows }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-400"><tr>{cols.map((c) => <th key={c} className="py-2 pr-4">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-white/5">{cols.map((c) => <td key={c} className="py-2 pr-4">{typeof r[c] === 'number' ? r[c].toFixed(3) : r[c]}</td>)}</tr>)}</tbody>
    </table></div>
  );
};

export default function ModelInfo() {
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/model/metrics').then((r) => setM(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <div className="card text-amber-300">Could not load model info: {err}. Run <code>python train.py</code> inside the ml folder first.</div>;
  if (!m) return <p className="text-slate-400">Loading…</p>;
  const img = (n) => `${API}/api/model/assets/${n}`;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Model performance</h1>
        <p className="text-sm text-slate-400">Best model: <b className="text-teal-300">{m.meta.best}</b> · screening threshold {m.meta.threshold} · data: {m.meta.source}</p></div>
      <div className="card"><h3 className="mb-2 font-semibold">Cross-validation (5-fold × 3 repeats, training set)</h3><Table rows={m.cv} /></div>
      <div className="card"><h3 className="mb-2 font-semibold">Hold-out test set</h3><Table rows={m.test} /></div>
      <div className="grid gap-4 md:grid-cols-3">
        {['roc_curves.png', 'confusion_matrix.png', 'feature_importance.png'].map((n) => <div key={n} className="card bg-white p-2"><img src={img(n)} alt={n} className="w-full" /></div>)}
      </div>
    </div>
  );
}
