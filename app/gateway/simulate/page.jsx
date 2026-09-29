'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuickPayFlow from '../QuickPayFlow';
import AdminGateModal from './AdminGateModal';
import { getApiRoutes } from '../../paytrack/AppRoutes/apiRoutesHandler';
import { MosyCard, closeMosyCard } from '../../components/MosyCard';
import DynamicModalProvider from '../../components/DynamicModalProvider';
import logo from '../../img/logo/logo.png'; // outside public!

const apiRoutes = getApiRoutes();

function loadDeviceSetup() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('device_setup');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Simulated gateway — no fake amounts. Every confirmed payment is pushed
// to the reusable gatewayipn webhook, which resolves the tenant from
// merchantId server-side and logs the transaction.
export default function SimulateGatewayPage() {
  const router = useRouter();
  const [gateOpen, setGateOpen] = useState(false);
  const [deviceSetup, setDeviceSetup] = useState(loadDeviceSetup);

  useEffect(() => {
    document.title = 'Quick Pay Terminal';
  }, []);

  const context = deviceSetup && {
    merchant: deviceSetup.merchant?.title,
    branch: deviceSetup.branch?.title,
    user: deviceSetup.user?.title,
  };

  const logout = () => {
    try {
      localStorage.removeItem('device_setup');
      sessionStorage.removeItem('gateway_setup_source');
    } catch {}
    setDeviceSetup(null);
    setGateOpen(true); // straight back to the admin login component
  };

  const promptMerchantRequired = () => {
    MosyCard(
      'Merchant Required',
      <div className="qp-merchant-required">
        <p>This terminal isn't set up with a merchant yet. An admin needs to sign in and register a merchant before you can take payments.</p>
        <button
          type="button"
          className="qp-merchant-required-btn"
          onClick={() => {
            closeMosyCard();
            setGateOpen(true);
          }}
        >
          Admin Login
        </button>
      </div>
    );
  };

  return (
    <>
      <QuickPayFlow
        brand={{ name: 'Pay track (Terminal)', logo: logo.src }}
        merchant={{ name: 'Asanetic Mart', location: 'Juja, Kiambu' }}
        onSettings={() => setGateOpen(true)}
        context={context}
        onLogout={context ? logout : undefined}
        onConfirm={async ({ amount, currency, method, details }) => {
          if (!deviceSetup?.merchant?.id) {
            promptMerchantRequired();
            throw new Error('Merchant required — sign in as admin to set one up.');
          }

          const res = await fetch(apiRoutes.gatewayipn.base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: deviceSetup?.merchant?.id,
              branchId: deviceSetup?.branch?.id,
              branchName: deviceSetup?.branch?.title,
              userId: deviceSetup?.user?.id,
              userName: deviceSetup?.user?.title,
              amount,
              currency,
              method,
              details,
            }),
          });
          const result = await res.json().catch(() => null);

          if (result?.status !== 'success') {
            throw new Error(result?.message || 'Transaction could not be logged. Please try again.');
          }
          return { receiptNo: result.receiptNo };
        }}
      />
      {gateOpen && (
        <AdminGateModal
          onCancel={() => setGateOpen(false)}
          onProceed={(data) => {
            try { sessionStorage.setItem('gateway_setup_source', JSON.stringify(data)); } catch {}
            router.push('/gateway/setupaccount');
          }}
        />
      )}
      <DynamicModalProvider />
    </>
  );
}
