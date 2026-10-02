'use client';
import { MoneyflowSchema } from '../MoneyflowSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import MoneyflowActions from '../logicControl/actionsRegistry';
import SmartGridPro from '../../moduleControl/UiControl/Smartgridpro';
import SmartGridInsight from '../../moduleControl/UiControl/SmartGridInsight';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function MoneyflowList() {
//   return <SmartGrid moduleActions={MoneyflowActions} schema={MoneyflowSchema} title="Moneyflow" />;
// }PaidInvoicesSchema.label

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function modeTotalsStats(g) {
  const rows = g.rows || [];

  // Amount / Charges / Disbursed totals for whatever's currently loaded
  // (same "sum what's on this page" convention the per-mode cards below
  // already use, and what the grid's own sum:true footer shows).
  const totals = rows.reduce(
    (acc, r) => {
      acc.amount += Number(r.amount) || 0;
      acc.charges += Number(r.rate_amount) || 0;
      acc.disbursed += Number(r.disbursed) || 0;
      return acc;
    },
    { amount: 0, charges: 0, disbursed: 0 }
  );

  const totalCards = [
    { key: 'total_amount', label: 'Collected', value: money(totals.amount), icon: 'line-chart', tone: 'blue' },
    { key: 'total_charges', label: 'Charges', value: money(totals.charges), icon: 'percent', tone: 'amber' },
    { key: 'total_disbursed', label: 'Disbursed', value: money(totals.disbursed), icon: 'exchange', tone: 'green' },
  ];

  const byMode = {};
  rows.forEach((r) => {
    const mode = r.payment_mode || 'Other';
    byMode[mode] = (byMode[mode] || 0) + (Number(r.amount) || 0);
  });
  const toneByMode = { 'M-Pesa': 'green', Cash: 'amber', Card: 'blue', Bank: 'purple' };
  const modeCards = Object.entries(byMode).map(([mode, total]) => ({
    key: mode,
    label: mode,
    value: total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    icon: 'money',
    tone: toneByMode[mode] || 'teal',
  }));

  return [...totalCards, ...modeCards];
}

function monthLabel(dateStr) {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// Same "sum what's currently loaded" convention as modeTotalsStats above —
// grouped totals of `amount`, by mode / branch / month.
function paymentsBreakdowns(g) {
  const rows = g.rows || [];
  const sumBy = (keyFn) => {
    const totals = {};
    rows.forEach((r) => {
      const key = keyFn(r) || 'Unknown';
      totals[key] = (totals[key] || 0) + (Number(r.amount) || 0);
    });
    return Object.entries(totals).map(([label, value]) => ({ label, value, display: money(value) }));
  };

  return [
    {
      key: 'by_mode',
      title: 'By Payment Mode',
      type: 'donut',
      centerLabel: 'Total',
      centerValue: money(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)),
      items: sumBy((r) => r.payment_mode),
    },
    {
      key: 'by_branch',
      title: 'By Branch',
      type: 'bars',
      items: sumBy((r) => r._branch_name_branch_id || r.branch_id),
    },
    {
      key: 'by_month',
      title: 'By Month',
      type: 'bars',
      items: sumBy((r) => monthLabel(r.transaction_at)),
    },
  ];
}

export default function MoneyflowList({
  fixedQuery = {},
  dataOut = {},
  title = MoneyflowSchema.label,
  description = `${MoneyflowSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = MoneyflowActions,
  schema = MoneyflowSchema,
  hiddenActions=[],
  stats = modeTotalsStats,
  breakdowns = paymentsBreakdowns

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
      // breakdowns={breakdowns}
    />
  );
}