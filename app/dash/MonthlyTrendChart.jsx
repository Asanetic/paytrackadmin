'use client';
import { useState } from 'react';

// Full-width bar chart — transactions by month. Single series (amount),
// so one hue (--pd-accent) and no legend needed; the title names it.
// Hover shows a per-bar tooltip; the peak bar gets a direct label.
//
//   <MonthlyTrendChart data={[{ month: '2026-06', total: 123, count: 4 }, ...]} />

const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: 'short' });
};
const money = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function MonthlyTrendChart({ data = [], title = 'Transactions by month' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.total), 1);
  const peakIdx = data.reduce((best, d, i) => (d.total > data[best].total ? i : best), 0);

  return (
    <div className="pd-card pd-trend">
      <div className="pd-trend-head">
        <h3 className="pd-panel-title">{title}</h3>
      </div>
      <div className="pd-trend-bars">
        {data.map((d, i) => {
          const h = Math.max((d.total / max) * 100, 2);
          const active = hoverIdx === i;
          return (
            <div
              key={d.month}
              className="pd-trend-col"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {active && (
                <div className="pd-trend-tooltip">
                  <strong>{money(d.total)}</strong>
                  <span>{d.count} txn{d.count === 1 ? '' : 's'}</span>
                </div>
              )}
              <div className="pd-trend-bar-wrap">
                {i === peakIdx && !active && <span className="pd-trend-peak">{money(d.total)}</span>}
                <div className={`pd-trend-bar ${active ? 'is-active' : ''}`} style={{ height: `${h}%` }} />
              </div>
              <span className="pd-trend-label">{monthLabel(d.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
