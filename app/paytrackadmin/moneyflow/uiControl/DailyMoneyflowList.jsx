'use client';
import { DailyMoneyflowSchema } from '../DailyMoneyflowSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import MoneyflowActions from '../logicControl/actionsRegistry';
import SmartGridPro from '../../moduleControl/UiControl/Smartgridpro';

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Amount, totalled per payment mode, from the currently loaded page of
// rows — same "sum what's loaded" convention as PaymentsList's stats
// (and the grid's own column totals via schema field `sum: true`).
function modeTotalsStats(g) {
  const rows = g.rows || [];

  const grand = rows.reduce(
    (acc, r) => {
      acc.amount += Number(r.amount) || 0;
      acc.charges += Number(r.rate_amount) || 0;
      acc.disbursed += Number(r.disbursed) || 0;
      return acc;
    },
    { amount: 0, charges: 0, disbursed: 0 }
  );

  const totalCards = [
    { key: 'total_collected', label: 'Total collected', value: money(grand.amount), icon: 'money', tone: 'teal' },
    { key: 'total_charges', label: 'Total charges', value: money(grand.charges), icon: 'percent', tone: 'amber' },
    { key: 'total_disbursed', label: 'Total disbursed', value: money(grand.disbursed), icon: 'exchange', tone: 'blue' },
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
    value: money(total),
    icon: 'money',
    tone: toneByMode[mode] || 'teal',
  }));

  return [...totalCards, ...modeCards];
}

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function DailyMoneyflowList() {
//   return <SmartGrid moduleActions={MoneyflowActions} schema={DailyMoneyflowSchema} title="Moneyflow" />;
// }PaidInvoicesSchema.label
export default function DailyMoneyflowList({
  fixedQuery = {},
  dataOut = {},
  title = DailyMoneyflowSchema.label,
  description = `${DailyMoneyflowSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = MoneyflowActions,
  schema = DailyMoneyflowSchema,
  hiddenActions=[],
  stats = modeTotalsStats,

}) {
  return (
    <SmartGridPro
      moduleActions={moduleActions}
      schema={schema}
      title={title}
      description={description}
      customProfilePath={customProfilePath}
      fixedQuery={fixedQuery}
      dataOut={dataOut}
      hiddenActions={hiddenActions}
      stats={stats}
    />
  );
}
