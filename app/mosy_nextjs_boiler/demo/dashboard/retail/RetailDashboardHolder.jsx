'use client';
import { useEffect, useState } from 'react';
import PayDashboard from '../../../dash/PayDashboard';
import DashboardKpiCard from '../main/DashboardKpiCard';
import DashboardSectionCard from '../main/DashboardSectionCard';
import IncomeChargeBarChart from './IncomeChargeBarChart';
import { mosyGetData, formatKesShort } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';

const apiRoutes = getApiRoutes();

const fmtMoney = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY = {
  totals: { trxCount: 0, income: 0, charges: 0, disbursed: 0, incomeThisMonth: 0 },
  merchantCount: 0, branchCount: 0, modes: [], byMerchant: [], byMonth: [], recent: [],
};

const MODE_ICON = { 'M-Pesa': 'mobile', Cash: 'money', Card: 'credit-card', Bank: 'university' };

const fmtDateTime = (dt) => (dt ? new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function RetailDashboardHolder() {
  const [range, setRange] = useState({ start: todayStr(), end: todayStr() });
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    const res = await mosyGetData({ endpoint: apiRoutes.dashboard.retail, params: range });
    if (res?.status === 'success') {
      setData(res.data || EMPTY);
    } else {
      setError(res?.message || 'Unable to load dashboard data.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [range.start, range.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const { totals, merchantCount, branchCount, modes, byMerchant, byMonth, recent } = data;
  const byMonthChart = byMonth.map((m) => ({ label: monthLabel(m.month), income: m.income, charges: m.charges }));
  const byMerchantChart = byMerchant.map((m) => ({ label: m.label, income: m.income, charges: m.charges }));

  return (
    <PayDashboard
      loading={loading}
      greeting="Admin Summary"
      subtitle={error || 'Transactions, charges and disbursements across your branches.'}
      filters={[{ key: 'date', label: 'Date range', icon: 'calendar', type: 'date' }]}
      onApplyFilters={(values) => {
        const d = values.date;
        if (d?.from && d?.to) setRange({ start: d.from, end: d.to });
      }}
    >
      <div className="row m-0 mb-3" style={{ rowGap: 16, marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Total transactions" value={totals.trxCount.toLocaleString()} icon="fa fa-exchange" accent="blue" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Total charges" value={fmtMoney(totals.charges)} icon="fa fa-percent" accent="orange" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Total transacted amount" value={fmtMoney(totals.income)} icon="fa fa-line-chart" accent="green" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Amount disbursed" value={fmtMoney(totals.disbursed)} icon="fa fa-money" accent="blue" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Merchant count" value={merchantCount.toLocaleString()} icon="fa fa-building" accent="blue" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3 px-2">
          <DashboardKpiCard label="Branches count" value={branchCount.toLocaleString()} icon="fa fa-map-marker" accent="blue" />
        </div>
      </div>

      <div className="row m-0 mb-4" style={{ marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 px-2">
          <DashboardSectionCard title="Charge & transactions by mode" description="Payments broken down by payment method for this range.">
            {modes.length === 0 ? (
              <p className="text-muted small mb-0">No payments in this range.</p>
            ) : (
              <div className="row m-0" style={{ rowGap: 12, marginLeft: -6, marginRight: -6 }}>
                {modes.map((m) => (
                  <div key={m.mode} className="col-12 col-sm-6 col-lg-3 px-2">
                    <div className="retail-mode-card">
                      <div className="retail-mode-head">
                        <i className={`fa fa-${MODE_ICON[m.mode] || 'money'}`}></i> {m.mode}
                      </div>
                      <div className="retail-mode-amount">{fmtMoney(m.income)}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{m.trxCount.toLocaleString()} transactions</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{fmtMoney(m.charges)} charged</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{fmtMoney(m.disbursed)} disbursed</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>

      <div className="row m-0 mb-4" style={{ rowGap: 16, marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 px-2 mb-4">
          <DashboardSectionCard title="Income & charge by merchant" description="Top branches by income for this range.">
            <IncomeChargeBarChart data={byMerchantChart} height={360} />
          </DashboardSectionCard>
        </div>
        <div className="col-12 px-2">
          <DashboardSectionCard title="Income & charge by month" description="Last 12 months.">
            <IncomeChargeBarChart data={byMonthChart} height={360} />
          </DashboardSectionCard>
        </div>
      </div>

      <div className="row m-0 mb-4" style={{ marginLeft: -8, marginRight: -8 }}>
        <div className="col-12 px-2">
          <DashboardSectionCard title="Recent transactions" description="Most recent 20 transactions for this range.">
            {recent.length === 0 ? (
              <p className="text-muted small mb-0">No transactions in this range.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm retail-recent-table mb-0">
                  <thead>
                    <tr>
                      <th>Date/time</th>
                      <th>Mode</th>
                      <th>Branch</th>
                      <th>Payer</th>
                      <th>Reference</th>
                      <th className="text-end">Amount</th>
                      <th className="text-end">Charge</th>
                      <th className="text-end">Disbursed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.record_id}>
                        <td>{fmtDateTime(r.transaction_at)}</td>
                        <td><i className={`fa fa-${MODE_ICON[r.mode] || 'money'} me-1`}></i>{r.mode}</td>
                        <td>{r.branch_name}</td>
                        <td>{r.payer_name || '—'}</td>
                        <td>{r.external_ref || r.transaction_id}</td>
                        <td className="text-end">{fmtMoney(r.amount)}</td>
                        <td className="text-end">{fmtMoney(r.charges)}</td>
                        <td className="text-end">{fmtMoney(r.disbursed)}</td>
                        <td><span className="retail-status-pill">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
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
        .retail-mode-card { background: #f8f9fb; border-radius: 12px; padding: 14px; height: 100%; }
        .retail-mode-head { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
        .retail-mode-amount { font-size: 18px; font-weight: 700; }
        .retail-recent-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #888; border-top: none; }
        .retail-recent-table td { font-size: 13px; vertical-align: middle; }
        .retail-status-pill { background: #e7f7ed; color: #16a34a; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
      `}</style>
    </PayDashboard>
  );
}
