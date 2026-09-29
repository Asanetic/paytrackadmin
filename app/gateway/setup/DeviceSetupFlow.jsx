'use client';
import { useState } from 'react';
import SelectStep from './SelectStep';
import ConfirmStep from './ConfirmStep';

// ════════════════════════════════════════════════════════════════
// DeviceSetupFlow — Merchant → Branch → User → Finish.
// Owns only step navigation + the three selections. Lists and saving
// are yours:
//
//   <DeviceSetupFlow
//     merchants={[...]} branches={[...]} users={[...]}
//     loading={{ merchants, branches, users }}      // skeletons per step
//     onSelect={(stepKey, item) => ...}             // e.g. fetch branches for merchant
//     onFinish={async ({ merchant, branch, user }) => { save(...) }}  // throw = show error
//     onExit={() => ...}                            // back from step 1
//   />
//
// Item shape: { id, title, subtitle, meta, icon, tone, avatar, initials }
// Changing the merchant clears branch + user; changing branch clears user.
// ════════════════════════════════════════════════════════════════

export default function DeviceSetupFlow({
  merchants = [],
  branches = [],
  users = [],
  loading = {},
  onSelect,
  onSearch,              // optional (stepKey, query) => void for server search
  onFinish,
  onExit,
  notes,                 // override the confirm box bullets
  accent,
}) {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState({ merchant: null, branch: null, user: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pick = (key, item) => {
    setSel((s) => {
      if (s[key]?.id === item.id) return s;
      if (key === 'merchant') return { merchant: item, branch: null, user: null };
      if (key === 'branch') return { ...s, branch: item, user: null };
      return { ...s, user: item };
    });
    onSelect?.(key, item);
  };

  const shared = { accent };
  const searchFor = (key) => (onSearch ? (q) => onSearch(key, q) : undefined);

  if (step === 1) {
    return (
      <SelectStep
        {...shared}
        step={1}
        title="Select Merchant"
        subtitle="Search and select the merchant for this device"
        searchPlaceholder="Search merchant name or code..."
        items={merchants}
        loading={loading.merchants}
        value={sel.merchant?.id}
        onChange={(_, it) => pick('merchant', it)}
        onSearch={searchFor('merchant')}
        onBack={onExit}
        onNext={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <SelectStep
        {...shared}
        step={2}
        title="Select Branch"
        subtitle="Choose the branch for this device"
        searchPlaceholder="Search branch name or code..."
        items={branches}
        loading={loading.branches}
        emptyText="No branches found for this merchant."
        value={sel.branch?.id}
        onChange={(_, it) => pick('branch', it)}
        onSearch={searchFor('branch')}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    );
  }

  if (step === 3) {
    return (
      <SelectStep
        {...shared}
        step={3}
        title="Select User"
        subtitle="Choose the user who will use this device"
        searchPlaceholder="Search user name or phone..."
        items={users}
        loading={loading.users}
        emptyText="No users found for this branch."
        value={sel.user?.id}
        onChange={(_, it) => pick('user', it)}
        onSearch={searchFor('user')}
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
      />
    );
  }

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await onFinish?.(sel);
    } catch (e) {
      setError(e?.message || 'Could not save setup. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmStep
      {...shared}
      sections={[
        { key: 'merchant', label: 'Merchant', icon: 'shopping-bag', tone: 'lilac', item: sel.merchant, onChange: () => setStep(1) },
        { key: 'branch', label: 'Branch', icon: 'building-o', tone: 'mint', item: sel.branch, onChange: () => setStep(2) },
        { key: 'user', label: 'User', icon: 'user-o', tone: 'lilac', item: sel.user, onChange: () => setStep(3) },
      ]}
      notes={
        notes || [
          `Merchant ID: ${sel.merchant?.subtitle ?? sel.merchant?.id ?? '—'}`,
          `Branch ID: ${sel.branch?.subtitle ?? sel.branch?.id ?? '—'}`,
          `User ID: ${sel.user?.code ?? sel.user?.id ?? '—'}`,
          'Saved locally and included in all requests to the backend.',
        ]
      }
      busy={busy}
      error={error}
      onFinish={finish}
      onBack={() => setStep(3)}
    />
  );
}
