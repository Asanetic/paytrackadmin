'use client';
// Merchants/branches/users come from the admin login gate (real API data,
// stashed in sessionStorage before redirecting here). Falls back to sample
// data if opened directly without going through that gate.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeviceSetupFlow from '../setup/DeviceSetupFlow';
import SuccessStep from '../setup/SuccessStep';

const SAMPLE = {
  merchants: [
    { id: 12, title: 'Asanetic Mart', subtitle: 'MRC-0012', icon: 'shopping-bag', tone: 'purple' },
    { id: 45, title: 'GreenLeaf Stores', subtitle: 'MRC-0045', icon: 'leaf', tone: 'green' },
    { id: 67, title: 'Kijani Supermarket', subtitle: 'MRC-0067', icon: 'shopping-cart', tone: 'orange' },
  ],
  branches: [
    { id: 1, title: 'Juja Branch', subtitle: 'BR-001', meta: 'Juja, Kiambu', icon: 'building-o' },
    { id: 2, title: 'Thika Branch', subtitle: 'BR-002', meta: 'Thika', icon: 'building-o' },
  ],
  users: [
    { id: 'USR-0145', title: 'John Kamau', subtitle: 'Cashier', initials: 'JK' },
    { id: 'USR-0146', title: 'Grace Wanjiku', subtitle: 'Cashier', initials: 'GW' },
  ],
};

const initials = (name = '') => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function loadSetupSource() {
  if (typeof window === 'undefined') return SAMPLE;
  try {
    const raw = sessionStorage.getItem('gateway_setup_source');
    if (!raw) return SAMPLE;
    const src = JSON.parse(raw);
    return {
      merchants: (src.merchants || []).map((m) => ({
        id: m.record_id, title: m.merchant_name, subtitle: m.contact, meta: m.location, icon: 'shopping-bag', tone: 'purple',
      })),
      branches: (src.branches || []).map((b) => ({
        id: b.record_id, title: b.branch_name, subtitle: b.branch_code, meta: b.location, icon: 'building-o',
      })),
      users: (src.users || []).map((u) => ({
        id: u.record_id, title: u.name, subtitle: u.tel || u.email, initials: initials(u.name),
      })),
    };
  } catch {
    return SAMPLE;
  }
}

export default function SetupAccountPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [{ merchants, branches, users }] = useState(loadSetupSource);

  if (done) {
    return <SuccessStep onStartCollecting={() => router.push('/gateway/simulate')} />;
  }

  return (
    <DeviceSetupFlow
      merchants={merchants}
      branches={branches}
      users={users}
      onFinish={async (sel) => {
        localStorage.setItem('device_setup', JSON.stringify(sel));
        setDone(true);
      }}
      onExit={() => history.back()}
    />
  );
}
