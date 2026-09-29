'use client';
import QuickPayShell, { PrimaryButton } from './QuickPayShell';

// Step 3 — success + receipt.
// merchant: { name, location, logo? }
// details:  [{ icon, label, value }]  (or use receiptNo / dateTime / mode shorthand)
// actions:  [{ key, label, icon, onClick }]  (defaults: Print / Send SMS / Share)

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function ReceiptStep({
  amount,
  currency = 'KES',
  title = 'Payment Successful',
  merchant,
  receiptNo,
  dateTime,
  mode,
  details,
  actions,
  onPrint,
  onSendSms,
  onShare,
  onNewPayment,
  newPaymentLabel = 'New Payment',
  onBack,
  onSettings,
  context,
  onLogout,
  accent,
}) {
  const rows = details || [
    receiptNo && { icon: 'file-text-o', label: 'Receipt No.', value: receiptNo },
    dateTime && { icon: 'calendar', label: 'Date & Time', value: dateTime },
    mode && { icon: 'credit-card', label: 'Payment Mode', value: mode },
  ].filter(Boolean);

  const tiles = (
    actions || [
      onPrint && { key: 'print', label: 'Print', icon: 'print', onClick: onPrint },
      onSendSms && { key: 'sms', label: 'Send SMS', icon: 'comment-o', onClick: onSendSms },
      onShare && { key: 'share', label: 'Share', icon: 'share-alt', onClick: onShare },
    ]
  ).filter(Boolean);

  return (
    <QuickPayShell
      step={3}
      complete
      onBack={onBack}
      onSettings={onSettings}
      context={context}
      onLogout={onLogout}
      accent={accent}
      footer={onNewPayment && <PrimaryButton icon="plus" onClick={onNewPayment}>{newPaymentLabel}</PrimaryButton>}
    >
      <div className="qp-success">
        <div className="qp-success-badge" aria-hidden="true">
          <span><i className="fa fa-check" /></span>
        </div>
        <h1 className="qp-success-title">{title}</h1>
        <div className="qp-success-amount">{currency} {fmt(amount)}</div>
      </div>

      {(merchant || rows.length > 0) && (
        <div className="qp-card qp-receipt">
          {merchant && (
            <div className="qp-merchant">
              {merchant.logo ? <img src={merchant.logo} alt="" className="qp-merchant-logo" /> : <i className="fa fa-shopping-bag qp-row-icon" />}
              <div>
                <div className="qp-merchant-name">{merchant.name}</div>
                {merchant.location && <div className="qp-merchant-loc">{merchant.location}</div>}
              </div>
            </div>
          )}
          {rows.map((r) => (
            <div key={r.label} className="qp-row">
              <i className={`fa fa-${r.icon || 'info-circle'} qp-row-icon`} />
              <span className="qp-row-label">{r.label}</span>
              <span className="qp-row-value">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {tiles.length > 0 && (
        <div className="qp-tiles" style={{ '--qp-tiles': tiles.length }}>
          {tiles.map((t) => (
            <button key={t.key} type="button" className="qp-tile" onClick={t.onClick}>
              <i className={`fa fa-${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </QuickPayShell>
  );
}
