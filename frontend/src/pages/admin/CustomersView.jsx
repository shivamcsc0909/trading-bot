import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import {
  Users,
  Plus,
  Key,
  Lock,
  Power,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL'); // ALL, ACTIVE, SUSPENDED, ARCHIVED
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newPassword, setNewPassword] = useState('Trader@123456');
  const [selectedStrategyId, setSelectedStrategyId] = useState(1);

  const [createForm, setCreateForm] = useState({
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    const [custRes, stratRes] = await Promise.all([
      api.getCustomers(true),
      api.getStrategies()
    ]);

    if (custRes.success && custRes.data?.customers) {
      setCustomers(custRes.data.customers);
    }
    if (stratRes.success && stratRes.data?.strategies) {
      setStrategies(stratRes.data.strategies);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.createCustomer(createForm);
      if (res.success) {
        setMsg('Customer account created and license issued successfully!');
        setShowCreateModal(false);
        setCreateForm({ full_name: '', email: '', phone: '', country: 'India', password: 'Trader@123456', strategy_id: 1, notes: '' });
        loadData();
      }
    } catch (err) {
      alert('Error creating customer: ' + err.message);
    }
  };

  const handleToggleStatus = async (customer) => {
    const nextStatus = customer.is_active ? 0 : 1;
    await api.toggleCustomerStatus(customer.id, nextStatus);
    loadData();
  };

  const handleArchive = async () => {
    if (!selectedCustomer) return;
    await api.archiveCustomer(selectedCustomer.id);
    setShowArchiveModal(false);
    setMsg(`Customer ${selectedCustomer.full_name} archived. All trade and license history preserved.`);
    loadData();
  };

  const handleRestore = async (customer) => {
    await api.restoreCustomer(customer.id);
    setMsg(`Customer ${customer.full_name} restored to active status.`);
    loadData();
  };

  const handleAssignStrategy = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (selectedCustomer.bot_mode === 'LIVE') {
      const ok = window.confirm(
        `WARNING: Customer "${selectedCustomer.full_name}" is running in LIVE TRADING mode.\n\nChanging their strategy will take effect on the next EA heartbeat.\n\nProceed with strategy reassignment?`
      );
      if (!ok) return;
    }

    await api.assignCustomerStrategy(selectedCustomer.id, selectedStrategyId);
    setShowStrategyModal(false);
    setMsg(`Strategy updated for ${selectedCustomer.full_name}.`);
    loadData();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    await api.resetCustomerPassword(selectedCustomer.id, newPassword);
    alert('Password updated for ' + selectedCustomer.full_name);
    setShowPasswordModal(false);
  };

  // Filter & Search Logic
  const filtered = customers.filter((c) => {
    const matchSearch =
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.license_key?.toLowerCase().includes(search.toLowerCase()) ||
      String(c.account_number || '').includes(search);

    if (!matchSearch) return false;

    if (tabFilter === 'ACTIVE') return c.is_active == 1 && c.is_archived == 0;
    if (tabFilter === 'SUSPENDED') return c.is_active == 0 && c.is_archived == 0;
    if (tabFilter === 'ARCHIVED') return c.is_archived == 1;

    return true; // ALL
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Customer Management</h1>
          <p className="text-xs text-slate-400 mt-1">Lifecycle management, strategy assignment, soft-delete archiving, and security.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
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

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTabFilter(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                tabFilter === t
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t} ({customers.filter((c) => {
                if (t === 'ACTIVE') return c.is_active == 1 && c.is_archived == 0;
                if (t === 'SUSPENDED') return c.is_active == 0 && c.is_archived == 0;
                if (t === 'ARCHIVED') return c.is_archived == 1;
                return true;
              }).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customer, license, MT5..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">License Key</th>
              <th className="pb-3 font-semibold">Assigned Strategy</th>
              <th className="pb-3 font-semibold">MT5 Terminal</th>
              <th className="pb-3 font-semibold">Balance</th>
              <th className="pb-3 font-semibold">Mode</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No customers found matching filter.
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40">
                  <td className="py-3 font-sans">
                    <div className="font-bold text-slate-100">{c.full_name}</div>
                    <div className="text-[11px] text-slate-400">{c.email} • {c.country}</div>
                  </td>
                  <td className="py-3 text-amber-400 font-bold text-[11px]">
                    {c.license_key || 'No License'}
                  </td>
                  <td className="py-3 font-sans text-slate-300">
                    <div>{c.strategy_name || 'XAUUSD 100-Block'}</div>
                    <div className="text-[10px] text-slate-500">v{c.strategy_version || '1.0'}</div>
                  </td>
                  <td className="py-3 text-slate-300">
                    {c.account_number ? `#${c.account_number} (${c.broker || 'Demo'})` : 'Unlinked'}
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
                    {c.is_archived == 1 ? (
                      <Badge variant="default" size="xs">ARCHIVED</Badge>
                    ) : (
                      <Badge variant={c.is_active ? 'success' : 'danger'} size="xs">
                        {c.is_active ? 'ENABLED' : 'SUSPENDED'}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 text-right font-sans space-x-1.5">
                    {c.is_archived == 1 ? (
                      <button
                        onClick={() => handleRestore(c)}
                        title="Restore Customer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSelectedStrategyId(c.strategy_id || 1);
                            setShowStrategyModal(true);
                          }}
                          title="Assign Strategy"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs inline-flex items-center"
                        >
                          <Layers size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowPasswordModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center"
                        >
                          <Lock size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                            c.is_active
                              ? 'bg-amber-950/60 border-amber-800/60 text-amber-300 hover:bg-amber-900/60'
                              : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {c.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowArchiveModal(true);
                          }}
                          title="Archive Customer (Soft Delete)"
                          className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900 text-xs inline-flex items-center"
                        >
                          <Archive size={13} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4 text-xs text-slate-400 font-sans">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} customers
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono font-bold text-slate-200">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Initial Strategy</label>
                <select
                  value={createForm.strategy_id}
                  onChange={(e) => setCreateForm({ ...createForm, strategy_id: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} v{s.version || '1.0'})
                    </option>
                  ))}
                </select>
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

      {/* Modal: Assign Strategy */}
      {showStrategyModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers size={18} className="text-amber-400" />
              <span>Assign Strategy: {selectedCustomer.full_name}</span>
            </h2>

            {selectedCustomer.bot_mode === 'LIVE' && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Warning:</strong> This customer is currently running in <strong>LIVE TRADING</strong> mode.
                  Ensure you verify strategy compatibility before switching.
                </p>
              </div>
            )}

            <form onSubmit={handleAssignStrategy} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Strategy</label>
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} v{s.version || '1.0'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStrategyModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient text-slate-950 font-bold px-4 py-1.5 rounded-lg shadow-md"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Archive Customer (Soft Delete) */}
      {showArchiveModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Archive size={18} className="text-rose-400" />
              <span>Archive Customer Account?</span>
            </h2>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-2 leading-relaxed">
              <p>
                You are archiving <strong>{selectedCustomer.full_name}</strong> ({selectedCustomer.email}).
              </p>
              <p className="text-[11px] text-slate-400">
                • <strong>Soft Delete Policy:</strong> All closed trades, deal tickets, account balances, and audit records will remain <strong>permanently intact</strong> in the database.
              </p>
              <p className="text-[11px] text-slate-400">
                • The bot instance and license will be suspended.
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">
                • You can restore this customer at any time from the "Archived" tab.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Archive Customer
              </button>
            </div>
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
