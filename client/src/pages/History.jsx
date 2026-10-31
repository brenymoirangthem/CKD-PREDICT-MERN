import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api.js';
import RiskBadge from '../components/RiskBadge.jsx';

export default function History() {
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });

  useEffect(() => {
    const t = setTimeout(() => api.get('/predictions', { params: { q, risk, page } }).then((r) => setData(r.data)), 250);
    return () => clearTimeout(t);
  }, [q, risk, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Patients <span className="text-base font-normal text-slate-500">({data.total})</span></h1>
        <div className="flex gap-2">
          <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input className="input pl-9" placeholder="Search name…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <select className="input w-auto" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}>
            <option value="">All risks</option><option>LOW</option><option>MODERATE</option><option>HIGH</option>
          </select>
        </div>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400"><tr><th className="p-4">Patient</th><th>Probability</th><th>Risk</th><th>Referral</th><th>Date</th></tr></thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r._id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4"><Link className="text-teal-300 hover:underline" to={`/prediction/${r._id}`}>{r.patientName}</Link></td>
                <td>{(r.probability * 100).toFixed(1)}%</td><td><RiskBadge risk={r.risk} /></td>
                <td>{r.flagged ? 'Yes' : 'No'}</td><td className="text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!data.items.length && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No patients found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm">
        <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="text-slate-400">Page {page} of {data.pages}</span>
        <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
