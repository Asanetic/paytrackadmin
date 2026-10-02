'use client';
import { useMemo, useState } from 'react';
import mosyThemeConfigs from '../appConfigs/mosyTheme';
import './PayDashboard.css';

// ════════════════════════════════════════════════════════════════
// PayDashboard — presentation only. No fetching, no router, no state
// beyond the filter selects' local values. Every number, list and click
// comes in through props, so the page (or a hook) owns the data:
//
//   <PayDashboard
//     userName="Sarah"
//     subtitle="Your payment reconciliation for today."
//     filters={[...]}            onApplyFilters={(values) => ...}
//     hero={{...}}
//     methods={[...]}
//     recent={{ title, items, onViewAll }}
//     attention={{ title, items, onViewAll }}
//   />
//
// See PayDashboard.sample.js for the full data shape.
//
// tone vocabulary (icons, pills, method cards):
//   blue | green | purple | amber | red | teal | gray
// status → pill tone is auto-mapped (matched/completed → green,
// waiting/pending → amber, failed/unmatched → red), overridable
// per item with `statusTone`.
// ════════════════════════════════════════════════════════════════

const STATUS_TONES = {
  matched: 'green', completed: 'green', reconciled: 'green', paid: 'green', success: 'green',
  waiting: 'amber', pending: 'amber', processing: 'amber', partial: 'amber',
  failed: 'red', unmatched: 'red', mismatch: 'red', duplicate: 'purple', missing: 'red',
};

const toneFor = (status, override) => override || STATUS_TONES[String(status || '').toLowerCase()] || 'gray';

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return { text: 'Good morning', icon: 'sun-o', tone: 'amber' };
  if (h < 17) return { text: 'Good afternoon', icon: 'sun-o', tone: 'amber' };
  return { text: 'Good evening', icon: 'moon-o', tone: 'purple' };
}

function IconBubble({ icon, tone = 'blue', size = 'md' }) {
  return (
    <span className={`pd-icon pd-icon-${size} pd-tone-${tone}`}>
      <i className={`fa fa-${icon}`}></i>
    </span>
  );
}

function ViewAll({ onClick, href, label = 'View all' }) {
  if (!onClick && !href) return null;
  const Tag = href ? 'a' : 'button';
  return (
    <Tag className="pd-link" href={href} onClick={onClick} type={href ? undefined : 'button'}>
      {label} <i className="fa fa-arrow-right"></i>
    </Tag>
  );
}

// ── Date range presets ─────────────────────────────────────────
const DATE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

// Local YYYY-MM-DD — NOT toISOString(), which converts through UTC and
// silently shifts a local midnight back a day in any UTC+ timezone
// (e.g. Africa/Nairobi), making "This month" quietly exclude today.
function presetRange(preset) {
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (preset === 'yesterday') {
    const d = new Date(today); d.setDate(d.getDate() - 1);
    return { from: iso(d), to: iso(d) };
  }
  if (preset === 'week') {
    const d = new Date(today); d.setDate(d.getDate() - d.getDay());
    return { from: iso(d), to: iso(today) };
  }
  if (preset === 'month') {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: iso(d), to: iso(today) };
  }
  return { from: iso(today), to: iso(today) };
}

// Presets auto-apply immediately on click. Start/End stay visible at all
// times (there's no separate "Custom" mode); editing either one just
// waits for the Apply button next to them (typing shouldn't refetch on
// every keystroke). Everything sits on one line, inline labels only
// (no stacked label-above-input) so nothing is offset from the buttons.
function DateRangeField({ value, onChange, onApplyClick }) {
  const preset = value?.preset || 'today';

  const pick = (key) => onChange({ preset: key, ...presetRange(key) }, true);

  return (
    <div className="pd-daterange">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`pd-preset-btn ${preset === p.key ? 'is-active' : ''}`}
          onClick={() => pick(p.key)}
        >
          {p.label}
        </button>
      ))}
      <label className="pd-daterange-field pt-2">
        <span className="pd-daterange-field-label">Start</span>
        <input
          type="date"
          className="pd-select pd-custom-date"
          value={value?.from || ''}
          onChange={(e) => onChange({ preset: 'custom', from: e.target.value, to: value?.to }, false)}
        />
      </label>
      <label className="pd-daterange-field pt-2">
        <span className="pd-daterange-field-label">End</span>
        <input
          type="date"
          className="pd-select pd-custom-date"
          value={value?.to || ''}
          min={value?.from || undefined}
          onChange={(e) => onChange({ preset: 'custom', from: value?.from, to: e.target.value }, false)}
        />
      </label>
      <button type="button" className="pd-btn pd-btn-solid pd-daterange-apply" onClick={onApplyClick}>
        Apply
      </button>
    </div>
  );
}

// ── Filters ─────────────────────────────────────────────────────
function FilterBar({ filters, onApply }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries((filters || []).map((f) => [
      f.key,
      f.type === 'date' ? (f.value ?? { preset: 'today', ...presetRange('today') }) : (f.value ?? f.options?.[0]?.value ?? ''),
    ]))
  );
  if (!filters || filters.length === 0) return null;

  // autoApply: presets fire immediately; typing a custom date just
  // updates local state until the field's own Apply button is clicked.
  const set = (key, val, autoApply = false) => {
    const next = { ...values, [key]: val };
    setValues(next);
    const f = filters.find((x) => x.key === key);
    f?.onChange?.(val);
    if (autoApply) onApply?.(next);
  };

  const hasNonDateFilter = filters.some((f) => f.type !== 'date');

  return (
    <div className="pd-card pd-filterbar">
      <div className="pd-filter-label">
        <i className="fa fa-filter"></i>
        <span>Filter dashboard</span>
      </div>
      <div className="pd-filter-fields">
        {filters.map((f) => (
          <label key={f.key} className={`pd-filter ${f.type === 'date' ? 'pd-filter-date' : ''}`}>
            <span className="pd-filter-caption">{f.label}</span>
            {f.type === 'date' ? (
              <DateRangeField
                value={values[f.key]}
                onChange={(val, autoApply) => set(f.key, val, autoApply)}
                onApplyClick={() => onApply?.(values)}
              />
            ) : (
              <span className="pd-select-wrap">
                {f.icon && <i className={`fa fa-${f.icon} pd-select-icon`}></i>}
                <select className="pd-select" value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </span>
            )}
          </label>
        ))}
      </div>
      {onApply && hasNonDateFilter && (
        <button type="button" className="pd-btn pd-btn-solid pt-2" onClick={() => onApply(values)}>
          Apply
        </button>
      )}
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────
function Donut({ percent = 0 }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="pd-donut">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="pd-donut-track" />
        <circle
          cx="60" cy="60" r={r}
          className="pd-donut-bar"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="pd-donut-label">{Math.round(p)}%</span>
    </div>
  );
}

function Hero({ hero }) {
  if (!hero) return null;
  const {
    label = 'Payments received', amount, change, changeLabel = 'vs yesterday',
    matched, total, matchedLabel = 'payments matched',
    attentionCount, attentionLabel = 'need your attention', onViewIssues, viewIssuesLabel = 'View issues',
  } = hero;

  const pct = total ? (Number(matched) / Number(total)) * 100 : hero.percent ?? 0;
  const up = typeof change === 'string' ? !change.trim().startsWith('-') : Number(change) >= 0;
  const hasMatch = matched !== undefined || hero.percent !== undefined;
  const hasAttention = attentionCount !== undefined && attentionCount !== null;

  return (
    // 3-column layout only when amount + match + attention are ALL
    // present — with just amount + attention (no match block), the
    // default 2-column grid already fits.
    <div className={`pd-hero ${hasMatch && hasAttention ? 'has-attention' : ''}`}>
      <div className="pd-hero-block pd-hero-amount">
        <div className="pd-hero-label">{label}</div>
        <div className="pd-hero-value">{amount}</div>
        {change !== undefined && change !== null && (
          <div className="pd-hero-change">
            <span className={`pd-chip ${up ? 'pd-chip-up' : 'pd-chip-down'}`}>
              <i className={`fa fa-arrow-${up ? 'up' : 'down'}`}></i> {String(change).replace(/^[-+]/, '')}
            </span>
            <span className="pd-muted">{changeLabel}</span>
          </div>
        )}
      </div>

      {(matched !== undefined || hero.percent !== undefined) && (
        <div className="pd-hero-block pd-hero-match">
          <Donut percent={pct} />
          <div className="pd-hero-match-text">
            {total !== undefined && (
              <div className="pd-hero-match-count">
                {Number(matched).toLocaleString()} of {Number(total).toLocaleString()}
              </div>
            )}
            <div className="pd-hero-match-label">{matchedLabel}</div>
            <div className="pd-progress">
              <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
            </div>
          </div>
        </div>
      )}

      {hasAttention && (
        <div className="pd-hero-block pd-hero-alert">
          <span className="pd-alert-icon"><i className="fa fa-exclamation"></i></span>
          <div>
            <div className="pd-alert-count">{Number(attentionCount).toLocaleString()}</div>
            <div className="pd-alert-label">{attentionLabel}</div>
            {onViewIssues && (
              <button type="button" className="pd-alert-btn" onClick={onViewIssues}>
                {viewIssuesLabel} <i className="fa fa-arrow-right"></i>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Method cards ────────────────────────────────────────────────
function MethodCards({ methods }) {
  if (!methods || methods.length === 0) return null;
  return (
    <div className="pd-methods">
      {methods.map((m) => {
        const Tag = m.onClick ? 'button' : 'div';
        return (
          <Tag
            key={m.key || m.label}
            type={m.onClick ? 'button' : undefined}
            className={`pd-card pd-method ${m.onClick ? 'is-clickable' : ''}`}
            onClick={m.onClick}
          >
            <div className="pd-method-top">
              <div className="pd-method-head">
                <IconBubble icon={m.icon || 'money'} tone={m.tone || 'blue'} size="lg" />
                <div className="pd-method-name">{m.label}</div>
              </div>
              {m.matchedPercent !== undefined && (
                <div className={`pd-method-badge pd-soft-${m.tone || 'blue'}`}>
                  <strong>{m.matchedPercent}%</strong>
                  <span>{m.badgeLabel || 'matched'}</span>
                </div>
              )}
            </div>
            <div className="pd-method-amount">{m.amount}</div>
            {m.count !== undefined && (
              <div className="pd-muted">
                {Number(m.count).toLocaleString()} {m.countLabel || 'payments'}
              </div>
            )}
          </Tag>
        );
      })}
    </div>
  );
}

// ── Lists ───────────────────────────────────────────────────────
function RecentList({ panel }) {
  if (!panel) return null;
  const items = panel.items || [];
  return (
    <div className="pd-card pd-panel">
      <div className="pd-panel-head">
        <h3 className="pd-panel-title">{panel.title || 'Recent payments'}</h3>
        <ViewAll onClick={panel.onViewAll} href={panel.viewAllHref} />
      </div>
      {items.length === 0 ? (
        <div className="pd-empty">{panel.emptyText || 'No payments yet.'}</div>
      ) : (
        <ul className="pd-list">
          {items.map((it, i) => {
            const Tag = it.onClick ? 'button' : 'div';
            return (
              <li key={it.key || i}>
                <Tag type={it.onClick ? 'button' : undefined} className={`pd-row pd-row-recent ${it.onClick ? 'is-clickable' : ''}`} onClick={it.onClick}>
                  <IconBubble icon={it.icon || 'money'} tone={it.tone || 'blue'} />
                  <div className="pd-row-main">
                    <div className="pd-row-title">{it.title}</div>
                    {it.subtitle && <div className="pd-row-sub">{it.subtitle}</div>}
                  </div>
                  <div className="pd-row-amount">{it.amount}</div>
                  <div className="pd-row-time">{it.time}</div>
                  {it.status && <span className={`pd-pill pd-soft-${toneFor(it.status, it.statusTone)}`}>{it.status}</span>}
                </Tag>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AttentionList({ panel }) {
  if (!panel) return null;
  const items = panel.items || [];
  return (
    <div className="pd-card pd-panel">
      <div className="pd-panel-head">
        <h3 className="pd-panel-title">{panel.title || 'Needs your attention'}</h3>
        <ViewAll onClick={panel.onViewAll} href={panel.viewAllHref} />
      </div>
      {items.length === 0 ? (
        <div className="pd-empty">
          <i className="fa fa-check-circle pd-empty-ok"></i> {panel.emptyText || 'All clear — nothing needs attention.'}
        </div>
      ) : (
        <ul className="pd-list">
          {items.map((it, i) => {
            const Tag = it.onClick ? 'button' : 'div';
            return (
              <li key={it.key || i}>
                <Tag type={it.onClick ? 'button' : undefined} className={`pd-row pd-row-attn ${it.onClick ? 'is-clickable' : ''}`} onClick={it.onClick}>
                  <IconBubble icon={it.icon || 'exclamation-triangle'} tone={it.tone || 'red'} />
                  <div className="pd-row-main">
                    <div className="pd-row-title pd-row-title-normal">{it.title}</div>
                    {it.subtitle && <div className="pd-row-sub">{it.subtitle}</div>}
                  </div>
                  <div className="pd-row-right">
                    <div className="pd-row-amount">{it.amount}</div>
                    {it.time && <div className="pd-row-sub">{it.time}</div>}
                  </div>
                  {it.onClick && <i className="fa fa-angle-right pd-row-chevron"></i>}
                </Tag>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function PayDashboard({
  userName,
  greeting,              // override text, e.g. "Welcome back"
  subtitle,
  filters,
  onApplyFilters,
  hero,
  methods,
  recent,
  attention,
  loading = false,
  children,              // extra rows rendered at the bottom
}) {
  const themeVars = useMemo(
    () => ({
      '--pd-accent': mosyThemeConfigs.btnBg,
      '--pd-accent-contrast': mosyThemeConfigs.btnTxt,
      '--pd-accent-dark': `color-mix(in srgb, ${mosyThemeConfigs.btnBg} 85%, #000000)`,
      '--pd-accent-soft': `color-mix(in srgb, ${mosyThemeConfigs.btnBg} 12%, transparent)`,
    }),
    []
  );

  const g = greetingFor();
  const heading = `${greeting || g.text}${userName ? `, ${userName}` : ''}`;

  return (
    <div className={`pd-root ${loading ? 'is-loading' : ''}`} style={themeVars}>
      <div className="pd-header">
        <h1 className="pd-title">
          {heading} <i className={`fa fa-${g.icon} pd-greet-icon pd-text-${g.tone}`}></i>
        </h1>
        {subtitle && <p className="pd-subtitle">{subtitle}</p>}
      </div>

      <FilterBar filters={filters} onApply={onApplyFilters} />
      <Hero hero={hero} />
      <MethodCards methods={methods} />

      {(recent || attention) && (
        <div className={`pd-panels ${recent && attention ? 'is-split' : ''}`}>
          <RecentList panel={recent} />
          <AttentionList panel={attention} />
        </div>
      )}

      {children}

      {loading && (
        <div className="pd-loading-veil" aria-live="polite">
          <span className="pd-spinner"></span>
        </div>
      )}
    </div>
  );
}
