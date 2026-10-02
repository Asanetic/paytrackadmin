import { Suspense } from 'react';
import BybranchMoneyflowList from '../uiControl/BybranchMoneyflowList';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';

// No separate backend/schema needed — the bybranch aggregate endpoint
// already supports ?period=day|month (see app/api/.../moneyflow/bybranch/route.js),
// so this just re-renders the same grid with period=month baked in via
// fixedQuery and a different title.

export async function generateMetadata() {
  return {
    title: 'Monthly Transaction Summary',
    description: 'supercrm Tasks',
    icons: { icon: `${hiveRoutes.hiveBaseRoute}/logo.png` },
  };
}

export default function Page() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-0 m-0 ">
            <Suspense fallback={<div className="col-md-12 p-5 text-center h3">Loading...</div>}>
              <BybranchMoneyflowList
                title="Monthly Transaction Summary"
                description="Totals by month, branch and payment mode"
                fixedQuery={{ period: 'month' }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
