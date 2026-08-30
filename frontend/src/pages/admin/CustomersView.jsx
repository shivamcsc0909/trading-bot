import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Users, Plus, Key, Lock, Power, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newPassword, setNewPassword] = useState('Trader@123456');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: 'India',
    password: 'Trader@123456',
    strategy_id: 1,
    notes: ''
  });

  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(false);
    const res = await api.getCustomers();
    if (res.success && res.data?.customers) {
      setCustomers(res.data.customers);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.createCustomer(form);
      if (res.success) {
        setMsg('Customer account and license generated successfully!');
        setShowCreateModal(false);
        setForm({ full_name: '', email: '', phone: '', country: 'India', password: 'Trader@123456', strategy_id: 1, notes: '' });
        loadCustomers();
      }
    } catch (err) {
      alert('Error creating customer: ' + err.message);
    }
  };

  const handleToggleStatus = async (customer) => {
    const nextStatus = customer.is_active ? 0 : 1;
    await api.toggleCustomerStatus(customer.id, nextStatus);
    loadCustomers();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    await api.resetCustomerPassword(selectedCustomer.id, newPassword);
    alert('Password updated for ' + selectedCustomer.full_name);
    setShowPasswordModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Customer Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage onboarded traders, issue licenses, and control bot access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="gold-gradient hover:opacity-95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} />
            <span>Onboard New Customer</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{msg}</span>
        </div>
      )}

      {/* Customers Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">License Key</th>
              <th className="pb-3 font-semibold">MT5 Account</th>
              <th className="pb-3 font-semibold">Balance</th>
              <th className="pb-3 font-semibold">Bot Mode</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-900/40">
                <td className="py-3 font-sans">
                  <div className="font-bold text-slate-100">{c.full_name}</div>
                  <div className="text-[11px] text-slate-400">{c.email} • {c.country}</div>
                </td>
                <td className="py-3 text-amber-400 font-bold text-[11px]">
                  {c.license_key || 'No License'}
                </td>
                <td className="py-3 text-slate-300">
                  {c.account_number ? `#${c.account_number}` : 'Unlinked'}
                </td>
                <td className="py-3 text-slate-100 font-bold">
                  ${parseFloat(c.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3">
                  <Badge variant={c.bot_mode === 'LIVE' ? 'danger' : 'info'} size="xs">
                    {c.bot_mode || 'DEMO'}
                  </Badge>
                </td>
                <td className="py-3 font-sans">
                  <Badge variant={c.is_active ? 'success' : 'danger'} size="xs">
                    {c.is_active ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </td>
                <td className="py-3 text-right font-sans space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowPasswordModal(true);
                    }}
                    title="Reset Password"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1"
                  >
                    <Lock size={12} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      c.is_active
                        ? 'bg-rose-950/60 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
                        : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                    }`}
                  >
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Customer */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-100">Onboard New Customer</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md shadow-amber-500/20"
                >
                  Create & Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showPasswordModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-100">Reset Password for {selectedCustomer.full_name}</h2>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient text-slate-950 font-bold px-4 py-1.5 rounded-lg"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
