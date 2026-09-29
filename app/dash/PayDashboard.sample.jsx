'use client';
// Example page wiring for PayDashboard. Replace the static objects
// with your API/hook results — the shapes are all the component needs.
import PayDashboard from '../../moduleControl/UiControl/PayDashboard';

export default function DashboardPage() {
  const go = (path) => () => (window.location.href = path);

  return (
    <PayDashboard
      userName="Sarah"
      subtitle="Your payment reconciliation for today."
      filters={[
        { key: 'date', label: 'Date range', icon: 'calendar', type: 'date', value: '2026-09-27' },
        {
          key: 'branch', label: 'Branch', icon: 'building-o',
          options: [
            { value: '', label: 'All branches' },
            { value: 'juja', label: 'Juja' },
            { value: 'ruiru', label: 'Ruiru' },
          ],
        },
        {
          key: 'method', label: 'Payment method', icon: 'credit-card',
          options: [
            { value: '', label: 'All methods' },
            { value: 'mpesa', label: 'M-Pesa' },
            { value: 'card', label: 'Card' },
            { value: 'bank', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
          ],
        },
        {
          key: 'source', label: 'Source', icon: 'database',
          options: [
            { value: '', label: 'All sources' },
            { value: 'mpesa_monitor', label: 'M-Pesa Monitor' },
            { value: 'manual', label: 'Manual' },
          ],
        },
      ]}
      onApplyFilters={(values) => console.log('apply', values)}
      hero={{
        amount: 'KES 8,312,500',
        change: '+4.8%',
        matched: 1247,
        total: 1271,
        attentionCount: 24,
        onViewIssues: go('/exceptions'),
      }}
      methods={[
        { key: 'mpesa', label: 'M-Pesa', icon: 'mobile', tone: 'green', amount: 'KES 4,520,300', count: 532, matchedPercent: 98 },
        { key: 'card', label: 'Card', icon: 'credit-card', tone: 'blue', amount: 'KES 2,410,800', count: 398, matchedPercent: 96 },
        { key: 'bank', label: 'Bank Transfer', icon: 'university', tone: 'purple', amount: 'KES 1,120,500', count: 210, matchedPercent: 97 },
        { key: 'cash', label: 'Cash', icon: 'money', tone: 'amber', amount: 'KES 260,900', count: 131, matchedPercent: 92 },
      ]}
      recent={{
        title: 'Recent payments',
        onViewAll: go('/payments'),
        items: [
          { title: 'M-Pesa', subtitle: 'QK72H8K2', icon: 'mobile', tone: 'green', amount: 'KES 4,500', time: '10:32', status: 'Matched' },
          { title: 'Card', subtitle: '449D3F1', icon: 'credit-card', tone: 'blue', amount: 'KES 12,000', time: '10:28', status: 'Matched' },
          { title: 'M-Pesa', subtitle: 'QK12A9D3', icon: 'mobile', tone: 'green', amount: 'KES 8,200', time: '10:25', status: 'Waiting' },
          { title: 'Bank', subtitle: 'FT29201', icon: 'university', tone: 'purple', amount: 'KES 6,700', time: '10:21', status: 'Matched' },
          { title: 'Cash', subtitle: 'CASH-001', icon: 'money', tone: 'amber', amount: 'KES 5,000', time: '10:18', status: 'Matched' },
        ],
      }}
      attention={{
        title: 'Needs your attention',
        onViewAll: go('/exceptions'),
        items: [
          { title: 'Missing payment', subtitle: 'INV-92811', icon: 'exclamation-triangle', tone: 'red', amount: 'KES 24,500', time: '2 hours ago', onClick: go('/exceptions?ref=INV-92811') },
          { title: 'Amount mismatch', subtitle: 'INV-92809', icon: 'exclamation-triangle', tone: 'amber', amount: 'KES 8,200', time: '3 hours ago', onClick: go('/exceptions?ref=INV-92809') },
          { title: 'Unmatched payment', subtitle: 'QK72H8K2', icon: 'exclamation-triangle', tone: 'amber', amount: 'KES 6,700', time: '4 hours ago', onClick: go('/exceptions?ref=QK72H8K2') },
          { title: 'Duplicate payment', subtitle: 'INV-92765', icon: 'files-o', tone: 'purple', amount: 'KES 5,000', time: '5 hours ago', onClick: go('/exceptions?ref=INV-92765') },
        ],
      }}
    />
  );
}
