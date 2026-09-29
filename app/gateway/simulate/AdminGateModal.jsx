'use client';
import { useState } from 'react';
import { hiveRoutes } from '../../appConfigs/hiveRoutes';
import { getApiRoutes } from '../../paytrack/AppRoutes/apiRoutesHandler';
import './AdminGateModal.css';

const apiRoutes = getApiRoutes();

async function fetchList(endpoint, token) {
  try {
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => null);
    return json?.status === 'success' ? (json.data || []) : [];
  } catch {
    return [];
  }
}

// Real admin login against the app's own /api/auth/login (same endpoint
// used by the main login form) — no more hard-coded password. On success
// we pull merchants/branches/users with the returned token and hand them
// to onProceed for the setup-account flow.
export default function AdminGateModal({ onCancel, onProceed }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return setError('Enter admin username and password');
    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('txt_username', username.trim());
      form.append('txt_password', password);
      form.append('auth_mosy_action', 'auth_login');

      const res = await fetch(`${hiveRoutes.hiveBaseRoute}/api/auth/login`, { method: 'POST', body: form });
      const result = await res.json().catch(() => null);

      if (result?.status !== 'success' || !result.accessToken) {
        setError(result?.message || 'Invalid admin username or password');
        setBusy(false);
        return;
      }

      const token = result.accessToken;
      const [merchants, branches, users] = await Promise.all([
        fetchList(apiRoutes.merchants.base, token),
        fetchList(apiRoutes.branches.base, token),
        fetchList(apiRoutes.systemusers.base, token),
      ]);

      onProceed?.({ merchants, branches, users });
    } catch {
      setError('Could not reach the server. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="ag-overlay" role="dialog" aria-modal="true" aria-label="Admin verification">
      <form className="ag-modal" onSubmit={submit}>
        <div className="ag-icon"><i className="fa fa-lock" /></div>
        <h2 className="ag-title">Admin Verification</h2>
        <p className="ag-subtitle">Sign in as an admin to register a new merchant account.</p>

        <input
          className="ag-input"
          type="text"
          placeholder="Admin username"
          value={username}
          autoFocus
          disabled={busy}
          onChange={(e) => { setUsername(e.target.value); setError(null); }}
        />
        <input
          className="ag-input"
          type="password"
          placeholder="Admin password"
          value={password}
          disabled={busy}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
        />
        {error && <div className="ag-error"><i className="fa fa-exclamation-circle" /> {error}</div>}

        <button type="submit" className="ag-primary" disabled={busy || !username.trim() || !password.trim()}>
          <span>{busy ? 'Signing in...' : 'Proceed'}</span>
          <span className="ag-primary-icon">{busy ? <span className="ag-spinner" /> : <i className="fa fa-arrow-right" />}</span>
        </button>
        <button type="button" className="ag-cancel" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
