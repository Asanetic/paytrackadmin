import { Suspense } from 'react';

import EarningsHolder from './EarningsHolder';

export async function generateMetadata() {
  return {
    title: 'Earnings',
    description: 'Income, charges and disbursements by payment mode',
    icons: { icon: "/logo.png" },
  };
}

export default function EarningsPage() {
  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content container-fluid p-2 m-0">
          <Suspense fallback={<div>Loading...</div>}>
            <EarningsHolder />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
