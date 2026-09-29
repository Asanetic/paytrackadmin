'use client';
import { useEffect, useState } from 'react';
import { mosyGetData } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';

const apiRoutes = getApiRoutes();
const fmtMoney = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const MODE_ICON = { 'M-Pesa': 'mobile', Cash: 'money', Card: 'credit-card', Bank: 'university' };

// Payment mode breakdown for one branch — trx count, income, charges,
// disbursed per mode. Fetched fresh each time the modal opens.
export default function BranchStatsModal({ branchId }) {
  const [data, setData] = useState({ totals: { trxCount: 0, income: 0, charges: 0, disbursed: 0 }, modes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!branchId) return;
    (async () => {
      setLoading(true);
      const res = await mosyGetData({ endpoint: apiRoutes.branches.stats, params: { branch_id: branchId } });
      if (res?.status === 'success') setData(res.data);
      else setError(res?.message || 'Unable to load branch stats.');
      setLoading(false);
    })();
  }, [branchId]);

  if (loading) return <div className="p-3 text-muted">Loading stats…</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  const { totals, modes } = data;

  return (
    <div className="branch-stats">
      <div className="branch-stats-totals">
        <div><span className="label">Transactions</span><span className="value">{totals.trxCount.toLocaleString()}</span></div>
        <div><span className="label">Income</span><span className="value">{fmtMoney(totals.income)}</span></div>
        <div><span className="label">Charges</span><span className="value">{fmtMoney(totals.charges)}</span></div>
        <div><span className="label">Disbursed</span><span className="value">{fmtMoney(totals.disbursed)}</span></div>
      </div>

      {modes.length === 0 ? (
        <p className="text-muted small mb-0 mt-3">No transactions for this branch yet.</p>
      ) : (
        <table className="table table-sm mt-3 mb-0">
          <thead>
            <tr>
              <th>Mode</th>
              <th className="text-end">Trx</th>
              <th className="text-end">Income</th>
              <th className="text-end">Charges</th>
              <th className="text-end">Disbursed</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr key={m.mode}>
                <td><i className={`fa fa-${MODE_ICON[m.mode] || 'money'} me-1`}></i>{m.mode}</td>
                <td className="text-end">{m.trxCount.toLocaleString()}</td>
                <td className="text-end">{fmtMoney(m.income)}</td>
                <td className="text-end">{fmtMoney(m.charges)}</td>
                <td className="text-end">{fmtMoney(m.disbursed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .branch-stats-totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
        .branch-stats-totals > div { background: #f8f9fb; border-radius: 10px; padding: 12px; }
        .branch-stats-totals .label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
        .branch-stats-totals .value { display: block; font-size: 16px; font-weight: 700; margin-top: 2px; }
      `}</style>
    </div>
  );
}
