'use client';
import { useCallback, useEffect, useState } from 'react';
import QuickPayShell, { PrimaryButton } from './QuickPayShell';

// Step 1 — keypad amount entry.
// Controlled (value + onChange) or uncontrolled (defaultValue).
// Physical keyboard: digits, Backspace, Delete/Esc = clear, Enter = continue.

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const BackspaceIcon = () => (
  <svg width="30" height="22" viewBox="0 0 30 22" fill="none" aria-hidden="true">
    <path d="M9.5 1.5h17a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-17L1.5 11l8-9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M14 7l7 8M21 7l-7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];

export default function AmountStep({
  value,
  defaultValue = 0,
  onChange,
  currency = 'KES',
  currencies,            // ['KES','UGX'] -> shows a picker
  onCurrencyChange,
  quickAmounts = [],     // e.g. [100, 500, 1000, 2000]
  min = 1,
  max,
  maxDigits = 9,
  brand = { name: 'Quick Pay' },
  onSettings,
  onContinue,            // (amount, currency) => void
  continueLabel = 'Continue',
  keyboard = true,
  context,
  onLogout,
  accent,
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(Number(defaultValue) || 0);
  const amount = controlled ? Number(value) || 0 : inner;

  const setAmount = useCallback(
    (next) => {
      const n = Math.max(0, Math.floor(Number(next) || 0));
      if (!controlled) setInner(n);
      onChange?.(n);
    },
    [controlled, onChange]
  );

  const press = useCallback(
    (key) => {
      const digits = amount ? String(amount) : '';
      if (key === 'back') return setAmount(digits.slice(0, -1));
      if (key === 'clear') return setAmount(0);
      const next = (digits + key).replace(/^0+/, '');
      if (next.length > maxDigits) return;
      if (max !== undefined && Number(next) > max) return;
      setAmount(next);
    },
    [amount, maxDigits, max, setAmount]
  );

  const canContinue = amount >= min;
  const submit = useCallback(() => canContinue && onContinue?.(amount, currency), [canContinue, onContinue, amount, currency]);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e) => {
      const t = e.target;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName) || t?.isContentEditable) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Delete' || e.key === 'Escape') press('clear');
      else if (e.key === 'Enter') submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, press, submit]);

  const display = fmt(amount);
  const size = display.length > 11 ? 'is-xs' : display.length > 8 ? 'is-sm' : display.length > 6 ? 'is-md' : '';

  return (
    <QuickPayShell
      step={1}
      brand={brand}
      onSettings={onSettings}
      context={context}
      onLogout={onLogout}
      accent={accent}
      footer={<PrimaryButton disabled={!canContinue} onClick={submit}>{continueLabel}</PrimaryButton>}
    >
      <div className="qp-card qp-amount-card">
        {currencies?.length > 1 ? (
          <label className="qp-currency qp-currency-select">
            <select value={currency} onChange={(e) => onCurrencyChange?.(e.target.value)} aria-label="Currency">
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <i className="fa fa-angle-down" />
          </label>
        ) : (
          <div className="qp-currency">{currency} <i className="fa fa-angle-down" /></div>
        )}

        <div className="qp-amount-row">
          <div className={`qp-amount ${size} ${amount ? '' : 'is-empty'}`} aria-live="polite">
            {display}
            <span className="qp-caret" aria-hidden="true" />
          </div>
          {amount > 0 && (
            <button type="button" className="qp-clear" aria-label="Clear amount" onClick={() => press('clear')}>
              <i className="fa fa-times" />
            </button>
          )}
        </div>
        {amount > 0 && amount < min && <div className="qp-hint">Minimum is {currency} {fmt(min)}</div>}
      </div>

      {quickAmounts.length > 0 && (
        <div className="qp-quick" style={{ '--qp-quick': quickAmounts.length }}>
          {quickAmounts.map((q) => (
            <button key={q} type="button" className={`qp-quick-btn ${amount === q ? 'is-active' : ''}`} onClick={() => setAmount(q)}>
              {fmt(q)}
            </button>
          ))}
        </div>
      )}

      <div className="qp-keypad">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="qp-key"
            onClick={() => press(k)}
            onContextMenu={k === 'back' ? (e) => { e.preventDefault(); press('clear'); } : undefined}
            aria-label={k === 'back' ? 'Delete last digit' : k}
          >
            {k === 'back' ? <BackspaceIcon /> : k}
          </button>
        ))}
      </div>
    </QuickPayShell>
  );
}
