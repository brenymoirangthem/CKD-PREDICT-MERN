import { RISK_COLOR } from '../utils/fields.js';
export default function RiskBadge({ risk }) {
  return <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: RISK_COLOR[risk], background: `${RISK_COLOR[risk]}22`, border: `1px solid ${RISK_COLOR[risk]}55` }}>{risk}</span>;
}
