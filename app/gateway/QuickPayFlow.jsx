'use client';
import { useState } from 'react';
import AmountStep from './AmountStep';
import ModeStep, { DEFAULT_METHODS } from './ModeStep';
import DetailStep from './DetailStep';
import ReceiptStep from './ReceiptStep';

// Methods that need extra input (phone/txn code/PIN) before paying.
// Cash needs nothing, so it confirms straight from the Mode step.
const METHODS_WITH_DETAILS = ['mpesa', 'bank', 'card'];

// ════════════════════════════════════════════════════════════════
// QuickPayFlow — connects Amount → Mode → Receipt. Owns only step
// navigation + the in-progress amount/method. The real payment call
// is yours via onConfirm:
//
//   <QuickPayFlow
//     merchant={{ name: 'Asanetic Mart', location: 'Juja, Kiambu' }}
//     onConfirm={async ({ amount, currency, method }) => {
//       const res = await api.pay(...);          // throw to show an error
//       return { receiptNo: res.receipt_no };    // optional: dateTime, mode, details
//     }}
//     onPrint={(receipt) => ...} onSendSms={...} onShare={...}
//   />
// ════════════════════════════════════════════════════════════════

const nowLabel = () =>
  new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });

export default function QuickPayFlow({
  brand = { name: 'Pay Track' },
  merchant,
  methods = DEFAULT_METHODS,
  defaultMethod = methods[0]?.key,
  currency: initialCurrency = 'KES',
  currencies,
  quickAmounts,
  min,
  onConfirm,
  onPrint,
  onSendSms,
  onShare,
  onSettings,
  onComplete,            // (receipt) => void, fires when step 3 shows
  context,               // { merchant, branch, user } — shown as a badge on every step
  onLogout,              // shown next to the context badge when given
  accent,
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState(initialCurrency);
  const [method, setMethod] = useState(defaultMethod);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const methodLabel = methods.find((m) => m.key === method)?.label;
  const needsDetails = METHODS_WITH_DETAILS.includes(method);
  const shared = { currency, onSettings, accent, context, onLogout };

  const confirm = async (details) => {
    setBusy(true);
    setError(null);
    try {
      const res = (await onConfirm?.({ amount, currency, method, details })) || {};
      const r = { amount, currency, method, mode: methodLabel, dateTime: nowLabel(), ...res };
      setReceipt(r);
      setStep(4);
      onComplete?.(r);
    } catch (e) {
      setError(e?.message || 'Payment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setAmount(0);
    setMethod(defaultMethod);
    setReceipt(null);
    setError(null);
    setStep(1);
  };

  if (step === 1) {
    return (
      <AmountStep
        {...shared}
        brand={brand}
        value={amount}
        onChange={setAmount}
        currencies={currencies}
        onCurrencyChange={setCurrency}
        quickAmounts={quickAmounts}
        min={min}
        onContinue={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <ModeStep
        {...shared}
        amount={amount}
        methods={methods}
        value={method}
        onChange={(k) => { setMethod(k); setError(null); }}
        onConfirm={(k) => (METHODS_WITH_DETAILS.includes(k) ? setStep(3) : confirm())}
        onBack={() => setStep(1)}
        confirmLabel={needsDetails ? 'Continue' : 'Confirm Payment'}
        busy={busy}
        error={error}
      />
    );
  }

  if (step === 3) {
    return (
      <DetailStep
        {...shared}
        method={method}
        methodLabel={methodLabel}
        amount={amount}
        onSubmit={confirm}
        onBack={() => { setError(null); setStep(2); }}
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <ReceiptStep
      {...shared}
      amount={receipt?.amount ?? amount}
      currency={receipt?.currency ?? currency}
      merchant={merchant}
      receiptNo={receipt?.receiptNo}
      dateTime={receipt?.dateTime}
      mode={receipt?.mode}
      details={receipt?.details}
      onPrint={onPrint && (() => onPrint(receipt))}
      onSendSms={onSendSms && (() => onSendSms(receipt))}
      onShare={onShare && (() => onShare(receipt))}
      onNewPayment={reset}
      onBack={reset}
    />
  );
}
