import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wand2 } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { GROUPS, SAMPLE_HIGH, SAMPLE_LOW } from '../utils/fields.js';

export default function NewPrediction() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [rec, setRec] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setRec({ ...rec, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post('/predictions', { patientName: name, record: rec });
      toast.success('Analysis complete');
      nav(`/prediction/${data._id}`);
    } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">New CKD screening</h1><p className="text-sm text-slate-400">Fields marked * are required. Blank optional values are estimated by the model.</p></div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => { setRec(SAMPLE_LOW); setName(name || 'Sample patient (healthy)'); }}><Wand2 size={15} /> Sample: low risk</button>
          <button type="button" className="btn-ghost" onClick={() => { setRec(SAMPLE_HIGH); setName(name || 'Sample patient (high risk)'); }}><Wand2 size={15} /> Sample: high risk</button>
        </div>
      </div>
      <div className="card"><label className="label">Patient name / ID *</label><input className="input max-w-md" value={name} onChange={(e) => setName(e.target.value)} required /></div>
      {GROUPS.map((g) => (
        <div key={g.title} className="card">
          <h3 className="mb-4 font-semibold text-teal-300">{g.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.fields.map((f) => (
              <div key={f.k}>
                <label className="label">{f.l}{f.req && ' *'}{f.u && <span className="ml-1 normal-case text-slate-500">({f.u})</span>}</label>
                {f.type === 'select' ? (
                  <select className="input" value={rec[f.k] ?? ''} onChange={set(f.k)}>
                    <option value="">— unknown —</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="number" step={f.step || 1} min={f.min} max={f.max} className="input" required={f.req} value={rec[f.k] ?? ''} onChange={set(f.k)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="btn w-full py-3 text-lg" disabled={busy}>{busy ? 'Analyzing…' : 'Analyze CKD risk'}</button>
    </form>
  );
}
