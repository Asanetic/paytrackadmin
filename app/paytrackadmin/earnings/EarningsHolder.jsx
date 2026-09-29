'use client';
import { useEffect, useState } from 'react';
import PayDashboard from '../../dash/PayDashboard';
import DashboardKpiCard from '../dashboard/main/DashboardKpiCard';
import DashboardSectionCard from '../dashboard/main/DashboardSectionCard';
import { mosyGetData } from '../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../AppRoutes/apiRoutesHandler';

const apiRoutes = getApiRoutes();
const fmtMoney = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY = { totals: { trxCount: 0, income: 0, charges: 0, disbursed: 0 }, modes: [] };
const MODE_ICON = { 'M-Pesa': 'mobile', mpesa: 'mobile', Cash: 'money', cash: 'money', Card: 'credit-card', card: 'credit-card', Bank: 'university', bank: 'university' };

export default function EarningsHolder() {
  const [range, setRange] = useState({ start: todayStr(), end: todayStr() });
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    const res = await mosyGetData({ endpoint: apiRoutes.earnings.base, params: range });
    if (res?.status === 'success') setData(res.data || EMPTY);
    else setError(res?.message || 'Unable to load earnings.');
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [range.start, range.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const { totals, modes } = data;

  return (
    <PayDashboard
      loading={loading}
      greeting="Earnings"
      subtitle={error || 'Income, charges and disbursements by payment mode.'}
      filters={[{ key: 'date', label: 'Date range', icon: 'calendar', type: 'date' }]}
      onApplyFilters={(values) => {
        const d = values.date;
        if (d?.from && d?.to) setRange({ start: d.from, end: d.to });
      }}
    >
      <div className="row m-0 mb-3" style={{ rowGap: 16, marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Transactions" value={totals.trxCount.toLocaleString()} icon="fa fa-exchange" accent="blue" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Income" value={fmtMoney(totals.income)} icon="fa fa-line-chart" accent="green" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Charges" value={fmtMoney(totals.charges)} icon="fa fa-percent" accent="orange" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Disbursed" value={fmtMoney(totals.disbursed)} icon="fa fa-money" accent="blue" />
        </div>
      </div>

      <div className="row m-0" style={{ marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 px-2">
          <DashboardSectionCard title="Earnings by mode" description="Transactions, income, charges and disbursed amount per payment mode for this range.">
            {modes.length === 0 ? (
              <p className="text-muted small mb-0">No transactions in this range.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm earnings-table mb-0">
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
                  <tfoot>
                    <tr className="earnings-total-row">
                      <td>Total</td>
                      <td className="text-end">{totals.trxCount.toLocaleString()}</td>
                      <td className="text-end">{fmtMoney(totals.income)}</td>
                      <td className="text-end">{fmtMoney(totals.charges)}</td>
                      <td className="text-end">{fmtMoney(totals.disbursed)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>

      <style jsx global>{`
        .dash-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 22px;
          min-height: 120px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dash-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
        .dash-card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
        .dash-card-value { font-size: 26px; font-weight: 700; line-height: 1.15; margin-top: 4px; }
        .dash-card-desc { font-size: 13px; color: #888; margin-top: 2px; }
        .earnings-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-top: none; }
        .earnings-table td { font-size: 13px; vertical-align: middle; }
        .earnings-total-row td { font-weight: 700; border-top: 2px solid rgba(0,0,0,0.08); }
      `}</style>
    </PayDashboard>
  );
}
