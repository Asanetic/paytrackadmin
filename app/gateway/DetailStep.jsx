'use client';
import { useCallback, useState } from 'react';
import QuickPayShell, { PrimaryButton } from './QuickPayShell';

const BackspaceIcon = () => (
  <svg width="26" height="19" viewBox="0 0 30 22" fill="none" aria-hidden="true">
    <path d="M9.5 1.5h17a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-17L1.5 11l8-9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M14 7l7 8M21 7l-7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

// Step 2b — method-specific payment details, shown after a mode that
// needs more input is picked (mpesa / bank / card). Cash skips this.
//   mpesa: phone number, then "Push STK" or "I've already paid"
//   bank:  transfer code
//   card:  4-digit PIN
//
//   <DetailStep method="mpesa" amount={...} currency="KES"
//     onSubmit={(details) => ...}   // details = { phone, viaStk } | { txnCode } | { pin }
//     onBack={...} busy error accent />

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function DetailStep({
  method,
  methodLabel,
  amount,
  currency = 'KES',
  onSubmit,
  onBack,
  onSettings,
  busy = false,
  error,
  context,
  onLogout,
  accent,
}) {
  const [phone, setPhone] = useState('');
  const [txnCode, setTxnCode] = useState('');
  const [pin, setPin] = useState('');

  const isMpesa = method === 'mpesa';
  const isBank = method === 'bank';
  const isCard = method === 'card';

  const phoneValid = /^0?7\d{8}$/.test(phone.trim());
  const canPush = isMpesa && phoneValid && !busy;
  const canConfirmPaid = isMpesa && !busy;
  const canConfirmBank = isBank && txnCode.trim().length >= 4 && !busy;
  const canConfirmCard = isCard && pin.length === 4 && !busy;

  const pressPin = useCallback(
    (key) => {
      if (busy) return;
      if (key === 'back') return setPin((p) => p.slice(0, -1));
      if (!key) return;
      setPin((p) => (p.length < 4 ? p + key : p));
    },
    [busy]
  );

  return (
    <QuickPayShell
      step={2}
      onBack={busy ? undefined : onBack}
      onSettings={onSettings}
      context={context}
      onLogout={onLogout}
      accent={accent}
      footer={
        <>
          {error && <div className="qp-error"><i className="fa fa-exclamation-circle" /> {error}</div>}
          {isMpesa && (
            <>
              <PrimaryButton icon="paper-plane" busy={busy} disabled={!canPush} onClick={() => onSubmit?.({ phone: phone.trim(), viaStk: true })}>
                Push STK
              </PrimaryButton>
              <button type="button" className="qp-secondary" disabled={!canConfirmPaid} onClick={() => onSubmit?.({ phone: phone.trim(), viaStk: false })}>
                I've already paid — confirm transaction
              </button>
            </>
          )}
          {isBank && (
            <PrimaryButton icon="check" busy={busy} disabled={!canConfirmBank} onClick={() => onSubmit?.({ txnCode: txnCode.trim() })}>
              Confirm Payment
            </PrimaryButton>
          )}
          {isCard && (
            <PrimaryButton icon="check" busy={busy} disabled={!canConfirmCard} onClick={() => onSubmit?.({ pin })}>
              Complete Payment
            </PrimaryButton>
          )}
        </>
      }
    >
      <div className="qp-pay">
        <div className="qp-pay-label">Pay via {methodLabel || 'selected method'}</div>
        <div className="qp-pay-amount">{currency} {fmt(amount)}</div>
      </div>

      {isMpesa && (
        <div className="qp-field">
          <label className="qp-label" htmlFor="qp-phone">M-Pesa number</label>
          <input
            id="qp-phone"
            className="qp-input"
            type="tel"
            inputMode="numeric"
            placeholder="07XXXXXXXX"
            value={phone}
            disabled={busy}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
          />
          {phone && !phoneValid && <div className="qp-hint">Enter a valid Safaricom number</div>}
        </div>
      )}

      {isBank && (
        <div className="qp-field">
          <label className="qp-label" htmlFor="qp-txn">Bank transfer code</label>
          <input
            id="qp-txn"
            className="qp-input"
            type="text"
            placeholder="e.g. FT29201XXXX"
            value={txnCode}
            disabled={busy}
            onChange={(e) => setTxnCode(e.target.value.toUpperCase())}
          />
        </div>
      )}

      {isCard && (
        <div className="qp-field">
          <label className="qp-label">Card PIN</label>
          <div className="qp-pin-dots" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`qp-pin-dot ${i < pin.length ? 'is-filled' : ''}`} />
            ))}
          </div>
          <div className="qp-keypad qp-keypad-pin">
            {PIN_KEYS.map((k, i) => (
              <button
                key={i}
                type="button"
                className="qp-key"
                disabled={busy || !k}
                style={!k ? { visibility: 'hidden' } : undefined}
                onClick={() => pressPin(k)}
                onContextMenu={k === 'back' ? (e) => { e.preventDefault(); setPin(''); } : undefined}
                aria-label={k === 'back' ? 'Delete last digit' : k}
              >
                {k === 'back' ? <BackspaceIcon /> : k}
              </button>
            ))}
          </div>
        </div>
      )}
    </QuickPayShell>
  );
}
