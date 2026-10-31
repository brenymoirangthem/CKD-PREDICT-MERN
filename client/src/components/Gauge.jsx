import { RISK_COLOR } from '../utils/fields.js';

export default function Gauge({ probability, risk }) {
  const arc = Math.PI * 80;
  return (
    <div className="relative mx-auto w-64">
      <svg viewBox="0 0 200 115" className="w-full">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={RISK_COLOR[risk]} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${probability * arc} ${arc}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-4xl font-bold" style={{ color: RISK_COLOR[risk] }}>{(probability * 100).toFixed(1)}%</div>
        <div className="text-xs uppercase tracking-widest text-slate-400">CKD probability</div>
      </div>
    </div>
  );
}
