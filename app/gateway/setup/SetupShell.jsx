'use client';
import './DeviceSetup.css';

// Shared chrome: back button, 4-step stepper, heading, body, pinned footer.

export const SETUP_STEPS = ['Merchant', 'Branch', 'User', 'Finish'];

export function Stepper({ steps = SETUP_STEPS, current = 1 }) {
  return (
    <ol className="ds-steps" style={{ '--ds-step-count': steps.length }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'is-done' : n === current ? 'is-current' : '';
        return (
          <li key={label} className={`ds-step ${state}`}>
            <span className="ds-step-dot">{n < current ? <i className="fa fa-check" /> : n}</span>
            <span className="ds-step-label">{label}</span>
            {i < steps.length - 1 && <span className={`ds-step-line ${n < current ? 'is-done' : ''}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function PrimaryButton({ children, icon = 'arrow-right', busy = false, disabled, ...rest }) {
  return (
    <button type="button" className="ds-primary" disabled={disabled || busy} {...rest}>
      <span>{busy ? 'Please wait...' : children}</span>
      <span className="ds-primary-icon">{busy ? <span className="ds-spinner" /> : <i className={`fa fa-${icon}`} />}</span>
    </button>
  );
}

export default function SetupShell({ step, steps, title, subtitle, onBack, footer, accent, children }) {
  return (
    <div className="ds-root" style={accent ? { '--ds-accent': accent } : undefined}>
      <div className="ds-screen">
        <header className="ds-topbar">
          {onBack ? (
            <button type="button" className="ds-round" aria-label="Back" onClick={onBack}>
              <i className="fa fa-arrow-left" />
            </button>
          ) : (
            <span className="ds-spacer" />
          )}
        </header>

        <Stepper steps={steps} current={step} />

        <main className="ds-body" key={step}>
          {(title || subtitle) && (
            <div className="ds-heading">
              {title && <h1 className="ds-title">{title}</h1>}
              {subtitle && <p className="ds-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>

        {footer && <div className="ds-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Avatar used by list rows + confirm card: photo, initials, or icon tile.
export function ItemAvatar({ item, size = 'md' }) {
  if (item?.avatar) return <img src={item.avatar} alt="" className={`ds-avatar ds-avatar-${size}`} />;
  if (item?.initials) return <span className={`ds-avatar ds-avatar-${size} ds-initials`}>{item.initials}</span>;
  return (
    <span className={`ds-tile ds-tile-${size} ds-tone-${item?.tone || 'gray'}`}>
      <i className={`fa fa-${item?.icon || 'circle-o'}`} />
    </span>
  );
}
