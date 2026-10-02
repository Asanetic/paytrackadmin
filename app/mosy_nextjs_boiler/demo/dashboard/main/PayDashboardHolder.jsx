'use client';
import { useEffect, useState } from 'react';
import PayDashboard from '../../../dash/PayDashboard';
import MonthlyTrendChart from '../../../dash/MonthlyTrendChart';
import { mosyGetData } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';
import { MosyCard } from '../../../components/MosyCard';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';

const apiRoutes = getApiRoutes();

const METHOD_META = {
  'M-Pesa': { icon: 'mobile', tone: 'green' },
  Cash: { icon: 'money', tone: 'amber' },
  Card: { icon: 'credit-card', tone: 'blue' },
  Bank: { icon: 'university', tone: 'purple' },
};
const methodMeta = (mode) => METHOD_META[mode] || { icon: 'money', tone: 'gray' };

const fmtMoney = (n, currency = 'KES') => `${currency} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtTime = (dt) => (dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
const fmtAgo = (dt) => {
  if (!dt) return '';
  const mins = Math.round((Date.now() - new Date(dt).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return new Date(dt).toLocaleDateString();
};
// Local YYYY-MM-DD — not toISOString(), which shifts a day backward in
// any UTC+ timezone and was the reason "This month" quietly excluded today.
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY = { hero: { totalAmount: 0, totalCount: 0, daysWithActivity: 0, daysCashVerified: 0, daysMissingCash: 0, attentionCount: 0 }, methods: [], recent: [], attention: [], monthly: [] };

// Cash has no gateway/IPN callback — the only way it gets captured is a
// physical CDM/till deposit. Rather than send the user off to a manual
// entry form, this tells them what to actually go do, for the specific
// day that's missing it.
function showCdmWaitModal(day) {
  const dateLabel = day
    ? new Date(day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Today';

  MosyCard(
    'Waiting for CDM transaction',
    <div className="pd-cdm">
      <div className="pd-cdm-date">{dateLabel}</div>
      <span className="pd-cdm-spinner" />
      <p className="pd-cdm-text">Waiting for CDM update…</p>
      <p className="pd-cdm-sub">Deposit cash on the CDM machine to capture cash transactions for this day.</p>
    </div>
  );
}

export default function PayDashboardHolder() {
  const [range, setRange] = useState({ start: todayStr(), end: todayStr() });
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const go = (path) => () => (window.location.href = path);

  async function fetchData() {
    setLoading(true);
    setError(null);
    const res = await mosyGetData({ endpoint: apiRoutes.dashboard.pay, params: range });
    if (res?.status === 'success') {
      setData(res.data || EMPTY);
    } else {
      setError(res?.message || 'Unable to load dashboard data.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [range.start, range.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const { hero, methods, recent, attention, monthly } = data;

  return (
    <PayDashboard
      loading={loading}
      subtitle={error || 'Your payment reconciliation for today.'}
      filters={[
        { key: 'date', label: 'Date range', icon: 'calendar', type: 'date' },
      ]}
      onApplyFilters={(values) => {
        const d = values.date;
        if (d?.from && d?.to) setRange({ start: d.from, end: d.to });
      }}
      hero={{
        // "Matched" (payment_matches) has no producer anywhere yet, so
        // that donut/fraction widget is gone entirely — a ratio like
        // "2 of 2" reads as ambiguous no matter what it's labeled. Cash
        // is the one mode with no gateway/IPN callback, so it only shows
        // up if someone logs it by hand: a day with OTHER payments but
        // zero cash is a likely missed till/CDM entry. Surfaced as one
        // plain count instead — "N days missing cash" — same slot/style
        // as the attention count already used elsewhere on this card.
        amount: fmtMoney(hero.totalAmount),
        attentionCount: hero.daysMissingCash,
        attentionLabel: hero.daysMissingCash === 1 ? 'day missing cash' : 'days missing cash',
        onViewIssues: () => showCdmWaitModal(attention.find((a) => a.type === 'missing_cash')?.day),
        viewIssuesLabel: 'Log cash',
      }}
      methods={methods.map((m) => ({
        key: m.payment_mode,
        label: m.payment_mode,
        ...methodMeta(m.payment_mode),
        amount: fmtMoney(m.total),
        count: m.count,
      }))}
      recent={{
        title: 'Recent payments',
        onViewAll: go(`${hiveRoutes.paytrack}/moneyflow/list`),
        emptyText: 'No payments yet in this range.',
        items: recent.map((r) => ({
          key: r.record_id,
          title: r.payment_mode,
          subtitle: r.external_ref || r.transaction_id,
          ...methodMeta(r.payment_mode),
          amount: fmtMoney(r.amount, r.currency),
          time: fmtTime(r.transaction_at),
          status: r.status,
        })),
      }}
      attention={{
        title: 'Needs your attention',
        onViewAll: go(`${hiveRoutes.paytrack}/moneyflow/list`),
        emptyText: 'All clear — nothing needs attention.',
        items: attention.map((a) => ({
          key: a.record_id,
          title: a.title,
          subtitle: a.type === 'missing_cash'
            ? `${new Date(a.day).toLocaleDateString()} · ${a.count} other payment${a.count === 1 ? '' : 's'}, KES ${Number(a.amount).toLocaleString()} — no cash logged`
            : a.payment_ref,
          icon: a.type === 'missing_cash' ? 'money' : 'exclamation-triangle',
          tone: a.type === 'missing_cash' ? 'red' : (a.severity === 'high' ? 'red' : a.severity === 'low' ? 'gray' : 'amber'),
          amount: fmtMoney(a.amount),
          time: a.type === 'missing_cash' ? new Date(a.day).toLocaleDateString() : fmtAgo(a.at),
          onClick: a.type === 'missing_cash' ? () => showCdmWaitModal(a.day) : go('/paytrack/payments/profile'),
        })),
      }}
    >
      <MonthlyTrendChart data={monthly} />
    </PayDashboard>
  );
}
