'use client';
import { InMoneyflowSchema } from '../InMoneyflowSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import MoneyflowActions from '../logicControl/actionsRegistry';
import SmartGridInsight from '../../moduleControl/UiControl/SmartGridInsight';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function InMoneyflowList() {
//   return <SmartGrid moduleActions={MoneyflowActions} schema={InMoneyflowSchema} title="Moneyflow" />;
// }PaidInvoicesSchema.label


function modeTotalsStats(g) {
  const totals = {};
  (g.rows || []).forEach((r) => {
    const mode = r.payment_mode || 'Other';
    totals[mode] = (totals[mode] || 0) + (Number(r.amount) || 0);
  });
  const toneByMode = { 'M-Pesa': 'green', Cash: 'amber', Card: 'blue', Bank: 'purple' };
  return Object.entries(totals).map(([mode, total]) => ({
    key: mode,
    label: mode,
    value: total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    icon: 'money',
    tone: toneByMode[mode] || 'teal',
  }));
}

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      type: 'column',
      centerLabel: 'Total',
      centerValue: money(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)),
      items: sumBy((r) => r.payment_mode),
    },
    {
      key: 'by_branch',
      title: 'By Branch',
      type: 'donut',
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



export default function InMoneyflowList({
  fixedQuery = {},
  dataOut = {},
  title = InMoneyflowSchema.label,
  description = `${InMoneyflowSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = MoneyflowActions,
  schema = InMoneyflowSchema,
  hiddenActions=[],
  stats=modeTotalsStats,
  breakdowns=paymentsBreakdowns
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