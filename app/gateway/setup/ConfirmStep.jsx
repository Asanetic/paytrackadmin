'use client';
import SetupShell, { PrimaryButton, ItemAvatar } from './SetupShell';

// Step 4 — review + finish.
// sections: [{ key, label, icon, tone, item, onChange }]
//   item = the selected list item ({ title, subtitle, meta, avatar, initials })
//   user-type rows (item has avatar/initials) show the person inline
// notes: ['Merchant ID: MRC-0012', ...] -> the "This device will be registered with" box

export default function ConfirmStep({
  step = 4,
  title = 'Confirm Setup',
  subtitle = 'Review the selected details before saving to this device',
  sections = [],
  notesTitle = 'This device will be registered with:',
  notes = [],
  onFinish,
  onBack,
  busy = false,
  error,
  finishLabel = 'Finish Setup',
  accent,
}) {
  return (
    <SetupShell
      step={step}
      title={title}
      subtitle={subtitle}
      onBack={busy ? undefined : onBack}
      accent={accent}
      footer={
        <>
          {error && <div className="ds-error"><i className="fa fa-exclamation-circle" /> {error}</div>}
          <PrimaryButton icon="check" busy={busy} onClick={onFinish}>{finishLabel}</PrimaryButton>
        </>
      }
    >
      <div className="ds-card ds-summary">
        {sections.map((s) => {
          const person = s.item?.avatar || s.item?.initials;
          return (
            <div key={s.key} className="ds-summary-row">
              <span className={`ds-tile ds-tile-md ds-tone-${s.tone || 'lilac'}`}><i className={`fa fa-${s.icon}`} /></span>
              <div className="ds-summary-main">
                <div className="ds-summary-label">{s.label}</div>
                {person ? (
                  <div className="ds-summary-person">
                    <ItemAvatar item={s.item} size="sm" />
                    <div>
                      <div className="ds-summary-title">{s.item?.title}</div>
                      {s.item?.subtitle && <div className="ds-summary-sub">{s.item.subtitle}</div>}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ds-summary-title">{s.item?.title || '—'}</div>
                    {s.item?.subtitle && <div className="ds-summary-sub">{s.item.subtitle}</div>}
                    {s.item?.meta && <div className="ds-summary-sub">{s.item.meta}</div>}
                  </>
                )}
              </div>
              {s.onChange && !busy && (
                <button type="button" className="ds-link" onClick={s.onChange}>Change</button>
              )}
            </div>
          );
        })}
      </div>

      {notes.length > 0 && (
        <div className="ds-notice">
          <i className="fa fa-tablet ds-notice-icon" />
          <div>
            <div className="ds-notice-title">{notesTitle}</div>
            <ul className="ds-notice-list">
              {notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </div>
      )}
    </SetupShell>
  );
}
