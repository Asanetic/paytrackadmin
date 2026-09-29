'use client';
import { useMemo, useState } from 'react';
import SetupShell, { PrimaryButton, ItemAvatar } from './SetupShell';

// One searchable single-select list — used for Merchant, Branch and User.
//
// items: [{ id, title, subtitle, meta, icon, tone, avatar, initials, disabled }]
//   subtitle -> code / role line,  meta -> optional 3rd line (e.g. location)
//   visual: avatar (photo) > initials > icon on a tone tile
// Search filters locally by default; pass onSearch to search server-side
// (then the component just renders whatever `items` you give it).

export default function SelectStep({
  step,
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  items = [],
  value,                 // selected id
  onChange,              // (id, item) => void
  onNext,                // (item) => void
  onBack,
  onSearch,              // optional (query) => void
  loading = false,
  error,
  emptyText = 'No results found.',
  nextLabel = 'Next',
  accent,
}) {
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    if (onSearch) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => [it.title, it.subtitle, it.meta].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [items, query, onSearch]);

  const selected = items.find((it) => it.id === value);

  return (
    <SetupShell
      step={step}
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      accent={accent}
      footer={<PrimaryButton disabled={!selected} onClick={() => onNext?.(selected)}>{nextLabel}</PrimaryButton>}
    >
      <div className="ds-search">
        <i className="fa fa-search ds-search-icon" />
        <input
          type="search"
          className="ds-search-input"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
        />
      </div>

      {error && <div className="ds-error"><i className="fa fa-exclamation-circle" /> {error}</div>}

      <div className="ds-list" role="radiogroup" aria-label={title}>
        {loading && list.length === 0 ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="ds-item ds-skeleton" aria-hidden="true">
              <span className="ds-sk ds-sk-tile" />
              <span className="ds-sk-lines"><span className="ds-sk" /><span className="ds-sk ds-sk-short" /></span>
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="ds-empty"><i className="fa fa-search" /><div>{emptyText}</div></div>
        ) : (
          list.map((it) => {
            const isSel = it.id === value;
            return (
              <button
                key={it.id}
                type="button"
                role="radio"
                aria-checked={isSel}
                disabled={it.disabled}
                className={`ds-item ${isSel ? 'is-selected' : ''}`}
                onClick={() => onChange?.(it.id, it)}
              >
                <ItemAvatar item={it} />
                <span className="ds-item-text">
                  <span className="ds-item-title">{it.title}</span>
                  {it.subtitle && <span className="ds-item-sub">{it.subtitle}</span>}
                  {it.meta && <span className="ds-item-sub">{it.meta}</span>}
                </span>
                <span className="ds-radio" />
              </button>
            );
          })
        )}
      </div>
    </SetupShell>
  );
}
