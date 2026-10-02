'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatKesShort } from '../../../MosyUtils/hiveUtils';

// Two-series (income vs charges) bar chart — shared by the by-month and
// by-merchant sections; `data` items need { label, income, charges }.
export default function IncomeChargeBarChart({ data = [], height = 260 }) {
  const hasData = data.some((d) => d.income > 0 || d.charges > 0);
  if (!hasData) return <p className="text-muted small mb-0">No data for this range.</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatKesShort} width={70} />
        <Tooltip formatter={(v) => formatKesShort(v)} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#2563eb" radius={[6, 6, 0, 0]} />
        <Bar dataKey="charges" name="Charges" fill="#ea8a00" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
