'use client';
import { useEffect, useState } from 'react';
import { BranchesSchema } from '../BranchesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import BranchesActions from '../logicControl/actionsRegistry';
import SmartGridPro from '../../moduleControl/UiControl/Smartgridpro';
import SmartGridInsight from '../../moduleControl/UiControl/SmartGridInsight';
import { mosyGetData } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';

const apiRoutes = getApiRoutes();
const fmtMoney = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function BranchesList() {
//   return <SmartGrid moduleActions={BranchesActions} schema={BranchesSchema} title="Branches" />;
// }PaidInvoicesSchema.label
export default function BranchesList({
  fixedQuery = {},
  dataOut = {},
  title = BranchesSchema.label,
  description = `${BranchesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = BranchesActions,
  schema = BranchesSchema,
  hiddenActions=[],

}) {
  // All-time, all-branch totals — separate from the grid's own sum:true
  // columns, which only total the current PAGE of rows.
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await mosyGetData({ endpoint: apiRoutes.branches.summary });
      if (res?.status === 'success') setSummary(res.data);
    })();
  }, []);

  const stats = summary ? [
    { key: 'branches', label: 'Branches', value: summary.branchCount.toLocaleString(), icon: 'map-marker', tone: 'blue' },
    { key: 'paid', label: 'Total Paid', value: fmtMoney(summary.totalPaid), icon: 'money', tone: 'green' },
    { key: 'charges', label: 'Total Charges', value: fmtMoney(summary.totalCharges), icon: 'percent', tone: 'amber' },
    { key: 'disbursed', label: 'Total Disbursed', value: fmtMoney(summary.totalDisbursed), icon: 'exchange', tone: 'blue' },
  ] : [];

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
    />
  );
}