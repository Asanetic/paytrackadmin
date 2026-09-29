'use client';
import { MerchantsSchema } from '../MerchantsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import MerchantsActions from '../logicControl/actionsRegistry';
import SmartGridPro from '../../moduleControl/UiControl/Smartgridpro';
import SmartGridInsight from '../../moduleControl/UiControl/SmartGridInsight';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function MerchantsList() {
//   return <SmartGrid moduleActions={MerchantsActions} schema={MerchantsSchema} title="Merchants" />;
// }PaidInvoicesSchema.label
export default function MerchantsList({
  fixedQuery = {},
  dataOut = {},
  title = MerchantsSchema.label,
  description = `${MerchantsSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = MerchantsActions,
  schema = MerchantsSchema,
  hiddenActions=[],

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
    />
  );
}