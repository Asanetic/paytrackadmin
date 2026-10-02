'use client';
import { BymethodMoneyflowSchema } from '../BymethodMoneyflowSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import MoneyflowActions from '../logicControl/actionsRegistry';
import SmartGridInsight from '../../moduleControl/UiControl/SmartGridInsight';

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toneByMode = { 'M-Pesa': 'green', Cash: 'amber', Card: 'blue', Bank: 'purple' };

// Rows already come pre-grouped (period × branch × mode) from the
// bymethod aggregate endpoint — `total`/`count` are already sums, so
// these just re-group what's currently loaded, same "sum what's on
// the page" convention used elsewhere (no separate aggregate call).
function sumRowsBy(rows, keyFn) {
  const totals = {};
  rows.forEach((r) => {
    const key = keyFn(r) || 'Unknown';
    if (!totals[key]) totals[key] = { total: 0, count: 0 };
    totals[key].total += Number(r.total) || 0;
    totals[key].count += Number(r.count) || 0;
  });
  return totals;
}

function moneyflowStats(g) {
  const rows = g.rows || [];
  const byMode = sumRowsBy(rows, (r) => r.payment_mode);
  const grand = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const grandCharges = rows.reduce((s, r) => s + (Number(r.charges) || 0), 0);
  const grandDisbursed = rows.reduce((s, r) => s + (Number(r.disbursed) || 0), 0);
  const grandCount = rows.reduce((s, r) => s + (Number(r.count) || 0), 0);

  return [
    { key: 'grand_total', label: 'Total collected', value: money(grand), sub: `${grandCount.toLocaleString()} transactions`, icon: 'money', tone: 'teal' },
    { key: 'grand_charges', label: 'Total charges', value: money(grandCharges), icon: 'percent', tone: 'amber' },
    { key: 'grand_disbursed', label: 'Total disbursed', value: money(grandDisbursed), icon: 'exchange', tone: 'blue' },
    ...Object.entries(byMode).map(([mode, t]) => ({
      key: mode,
      label: mode,
      value: money(t.total),
      sub: `${t.count.toLocaleString()} transactions`,
      icon: 'credit-card',
      tone: toneByMode[mode] || 'blue',
    })),
  ];
}

function moneyflowBreakdowns(g) {
  const rows = g.rows || [];
  const toItems = (totals) => Object.entries(totals).map(([label, t]) => ({ label, value: t.total, display: money(t.total) }));

  return [
    {
      key: 'by_mode',
      title: 'By Payment Mode',
      type: 'donut',
      centerLabel: 'Total',
      centerValue: money(rows.reduce((s, r) => s + (Number(r.total) || 0), 0)),
      items: toItems(sumRowsBy(rows, (r) => r.payment_mode)),
    },
    {
      key: 'by_period',
      title: 'By Date',
      type: 'bars',
      items: toItems(sumRowsBy(rows, (r) => r.period)),
    },
  ];
}

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function BymethodMoneyflowList() {
//   return <SmartGrid moduleActions={MoneyflowActions} schema={BymethodMoneyflowSchema} title="Moneyflow" />;
// }PaidInvoicesSchema.label
export default function BymethodMoneyflowList({
  fixedQuery = {},
  dataOut = {},
  title = BymethodMoneyflowSchema.label,
  description = `${BymethodMoneyflowSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = MoneyflowActions,
  schema = BymethodMoneyflowSchema,
  hiddenActions=[],
  stats = moneyflowStats,
  breakdowns = moneyflowBreakdowns,

}) {
  return (
    <SmartGridInsight
      moduleActions={moduleActions}
      schema={schema}
      title={title}
      description={description}
      customProfilePath={customProfilePath}
      fixedQuery={fixedQuery}
      dataOut={dataOut}
      hiddenActions={hiddenActions}
      stats={stats}
      breakdowns={breakdowns}
    />
  );
}
