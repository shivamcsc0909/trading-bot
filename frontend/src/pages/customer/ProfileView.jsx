import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Lock, Key, CheckCircle2, Shield } from 'lucide-react';

export const ProfileView = ({ data }) => {
  const { user } = useAuth();
  const license = data?.license || {};

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setSaving(true);
    try {
      const res = await api.updatePassword(currentPassword, newPassword);
      if (res.success) {
        setMsg('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setErr(res.message || 'Failed to update password');
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Trader Profile & Security</h1>
        <p className="text-xs text-slate-400 mt-1">Manage account credentials and view commercial license allocations.</p>
      </div>

      {/* Account Info */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{user?.full_name || 'Shivam Gangele'}</h2>
            <p className="text-xs text-slate-400">{user?.email || 'customer@techforex.com'} • {user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Active License Key</div>
            <div className="font-mono font-bold text-amber-400 mt-1">{license?.license_key || 'TF-GOLD-8829-9401-K9X2'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">License Expiration</div>
            <div className="font-mono text-slate-200 mt-1">{license?.expires_at || '2027-12-31'}</div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Lock size={18} className="text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100">Update Password</h2>
        </div>

        {msg && <div className="p-3 rounded-lg bg-emerald-950 text-emerald-300 text-xs">{msg}</div>}
        {err && <div className="p-3 rounded-lg bg-rose-950 text-rose-300 text-xs">{err}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition"
        >
          {saving ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};
