import { Suspense } from 'react';
import InMoneyflowList from '../uiControl/InMoneyflowList';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';


export async function generateMetadata({ searchParams }) {
  const mosyTitle = "Moneyflow"//searchParams?.mosyTitle || "Tasks";

  return {
    title: mosyTitle ? decodeURIComponent(mosyTitle) : `Moneyflow`,
    description: 'supercrm Tasks',
    
    icons: {
      icon: `${hiveRoutes.hiveBaseRoute}/logo.png`
    },    
  };
}

export default function Page() {

return (
     <>
        <div className="main-wrapper">
          <div className="page-wrapper">
            <div className="content container-fluid p-0 m-0 ">
               <Suspense fallback={<div className="col-md-12 p-5 text-center h3">Loading...</div>}>
                 <InMoneyflowList />
               </Suspense>
            </div>
          </div>
        </div>
    </>
)
}
