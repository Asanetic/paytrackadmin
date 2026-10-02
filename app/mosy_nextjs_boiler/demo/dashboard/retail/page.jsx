import { Suspense } from 'react';

import RetailDashboardHolder from './RetailDashboardHolder';

export async function generateMetadata() {
  const mosyTitle = "Retail dashboard";

  return {
    title: mosyTitle,
    description: 'Retail transactions, charges and disbursements overview',
    icons: { icon: "/logo.png" },
  };
}

export default function RetailDashboard() {
  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content container-fluid p-2 m-0">
          <Suspense fallback={<div>Loading...</div>}>
            <RetailDashboardHolder />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
