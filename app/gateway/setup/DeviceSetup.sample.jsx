'use client';
// Sample data matching the mockup — swap for API results.
import DeviceSetupFlow from './DeviceSetupFlow';

const merchants = [
  { id: 12, title: 'Asanetic Mart', subtitle: 'MRC-0012', icon: 'shopping-bag', tone: 'purple' },
  { id: 45, title: 'GreenLeaf Stores', subtitle: 'MRC-0045', icon: 'leaf', tone: 'green' },
  { id: 67, title: 'Kijani Supermarket', subtitle: 'MRC-0067', icon: 'shopping-cart', tone: 'orange' },
  { id: 90, title: 'Urban Retail', subtitle: 'MRC-0090', icon: 'shopping-basket', tone: 'blue' },
  { id: 112, title: 'QuickBuy Limited', subtitle: 'MRC-0112', icon: 'th-large', tone: 'red' },
];

const branches = [
  { id: 1, title: 'Juja Branch', subtitle: 'BR-001', meta: 'Juja, Kiambu', icon: 'building-o' },
  { id: 2, title: 'Thika Branch', subtitle: 'BR-002', meta: 'Thika', icon: 'building-o' },
  { id: 3, title: 'Nakuru Branch', subtitle: 'BR-003', meta: 'Nakuru', icon: 'building-o' },
  { id: 4, title: 'Mombasa Branch', subtitle: 'BR-004', meta: 'Mombasa', icon: 'building-o' },
  { id: 5, title: 'Kisumu Branch', subtitle: 'BR-005', meta: 'Kisumu', icon: 'building-o' },
];

const users = [
  { id: 'USR-0145', title: 'John Kamau', subtitle: 'Cashier', initials: 'JK' /* , avatar: '/avatars/john.jpg' */ },
  { id: 'USR-0146', title: 'Grace Wanjiku', subtitle: 'Cashier', initials: 'GW' },
  { id: 'USR-0147', title: 'Peter Maina', subtitle: 'Manager', initials: 'PM' },
  { id: 'USR-0148', title: 'David Muthoni', subtitle: 'Supervisor', initials: 'DM' },
  { id: 'USR-0149', title: 'Susan Kibet', subtitle: 'Cashier', initials: 'SK' },
];

export default function DeviceSetupPage() {
  return (
    <DeviceSetupFlow
      merchants={merchants}
      branches={branches}
      users={users}
      onSelect={(key, item) => console.log('selected', key, item)}
      onFinish={async (sel) => {
        localStorage.setItem('device_setup', JSON.stringify(sel));
        console.log('saved', sel);
      }}
      onExit={() => history.back()}
    />
  );
}
