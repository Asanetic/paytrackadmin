'use client';
import QuickPayShell, { PrimaryButton } from './QuickPayShell';

// Step 2 — pick a payment mode.
// methods: [{ key, label, description, icon, tone, logo?, disabled? }]
// tone: green | mint | blue | purple | amber | red | gray

export const DEFAULT_METHODS = [
  { key: 'mpesa', label: 'M-Pesa', description: 'Pay via M-Pesa', icon: 'mobile', tone: 'green' },
  { key: 'cash', label: 'Cash', description: 'Cash payment', icon: 'money', tone: 'mint' },
  { key: 'card', label: 'Card', description: 'Debit / Credit card', icon: 'credit-card', tone: 'blue' },
  { key: 'bank', label: 'Bank', description: 'Bank transfer', icon: 'university', tone: 'purple' },
];

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function ModeStep({
  amount,
  currency = 'KES',
  methods = DEFAULT_METHODS,
  value,                 // selected method key
  onChange,              // (key) => void
  onConfirm,             // (key) => void
  onBack,
  onSettings,
  busy = false,
  error,
  payLabel = 'Pay',
  confirmLabel = 'Confirm Payment',
  context,
  onLogout,
  accent,
}) {
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
          <PrimaryButton busy={busy} disabled={!value} onClick={() => onConfirm?.(value)}>{confirmLabel}</PrimaryButton>
        </>
      }
    >
      <div className="qp-pay">
        <div className="qp-pay-label">{payLabel}</div>
        <div className="qp-pay-amount">{currency} {fmt(amount)}</div>
      </div>

      <div className="qp-methods" role="radiogroup" aria-label="Payment mode">
        {methods.map((m) => {
          const selected = m.key === value;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={m.disabled || busy}
              className={`qp-method ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange?.(m.key)}
            >
              <span className={`qp-method-icon qp-solid-${m.tone || 'blue'}`}>
                {m.logo ? <img src={m.logo} alt="" /> : <i className={`fa fa-${m.icon || 'money'}`} />}
              </span>
              <span className="qp-method-text">
                <span className="qp-method-title">{m.label}</span>
                {m.description && <span className="qp-method-sub">{m.description}</span>}
              </span>
              <span className="qp-radio">{selected && <i className="fa fa-check" />}</span>
            </button>
          );
        })}
      </div>
    </QuickPayShell>
  );
}
