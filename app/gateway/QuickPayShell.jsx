'use client';
import './QuickPay.css';

// Shared chrome for the 3 Quick Pay steps: top bar, stepper, body, pinned footer.
// Accent defaults to the mockup blue; pass `accent` (hex) to rebrand.

export function Stepper({ steps = ['Amount', 'Mode', 'Receipt'], current = 1, complete = false }) {
  return (
    <ol className="qp-steps">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current || (complete && n === current);
        const state = done ? 'is-done' : n === current ? 'is-current' : '';
        return (
          <li key={label} className={`qp-step ${state} ${n === current ? 'is-active' : ''}`}>
            <span className="qp-step-dot">{done ? <i className="fa fa-check" /> : n}</span>
            <span className="qp-step-label">{label}</span>
            {i < steps.length - 1 && <span className={`qp-step-line ${n < current ? 'is-done' : ''}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function PrimaryButton({ children, icon = 'arrow-right', busy = false, disabled, ...rest }) {
  return (
    <button type="button" className="qp-primary" disabled={disabled || busy} {...rest}>
      <span>{busy ? 'Please wait...' : children}</span>
      <span className="qp-primary-icon">{busy ? <span className="qp-spinner" /> : <i className={`fa fa-${icon}`} />}</span>
    </button>
  );
}

function ContextBadge({ context, onLogout }) {
  if (!context) return null;
  const items = [
    context.merchant && { icon: 'shopping-bag', label: context.merchant },
    context.branch && { icon: 'building-o', label: context.branch },
    context.user && { icon: 'user-o', label: context.user },
  ].filter(Boolean);
  if (items.length === 0 && !onLogout) return null;

  return (
    <div className="qp-context">
      <div className="qp-context-items">
        {items.map((it, i) => (
          <span className="qp-context-item" key={i}>
            <i className={`fa fa-${it.icon}`} /> {it.label}
          </span>
        ))}
      </div>
      {onLogout && (
        <button type="button" className="qp-context-logout" onClick={onLogout}>
          <i className="fa fa-sign-out" /> Log out
        </button>
      )}
    </div>
  );
}

export default function QuickPayShell({
  step, steps, complete, brand, onBack, onSettings, context, onLogout, footer, accent, children,
}) {
  return (
    <div className="qp-root" style={accent ? { '--qp-accent': accent } : undefined}>
      <div className="qp-screen">
        <header className="qp-topbar">
          {onBack ? (
            <button type="button" className="qp-round" aria-label="Back" onClick={onBack}>
              <i className="fa fa-arrow-left" />
            </button>
          ) : brand ? (
            <div className="qp-brand">
              {brand.logo ? (
                <img src={brand.logo} alt="" className="qp-brand-logo" />
              ) : (
                <span className="qp-brand-mark" aria-hidden="true"><span /><span /><span /></span>
              )}
              <span className="qp-brand-name">{brand.name}</span>
            </div>
          ) : (
            <span className="qp-spacer" />
          )}
          {onSettings ? (
            <button type="button" className="qp-round" aria-label="Settings" onClick={onSettings}>
              <i className="fa fa-cog" />
            </button>
          ) : (
            <span className="qp-spacer" />
          )}
        </header>

        <ContextBadge context={context} onLogout={onLogout} />

        <Stepper steps={steps} current={step} complete={complete} />

        <main className="qp-body" key={step}>{children}</main>

        {footer && <div className="qp-footer">{footer}</div>}
      </div>
    </div>
  );
}
