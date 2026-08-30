import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Key, Plus, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LicensesView = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(false);
    const res = await api.getLicenses();
    if (res.success && res.data?.licenses) {
      setLicenses(res.data.licenses);
    }
  };

  const handleToggleStatus = async (lic) => {
    const nextStatus = lic.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await api.createOrUpdateLicense({
      license_id: lic.id,
      status: nextStatus,
      expires_at: lic.expires_at,
      bot_enabled: lic.bot_enabled,
      max_accounts: lic.max_accounts
    });
    loadLicenses();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Commercial License Center</h1>
          <p className="text-xs text-slate-400 mt-1">Issue, renew, and enforce commercial licenses across MT5 bot instances.</p>
        </div>
        <button
          onClick={loadLicenses}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 p-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">License Key</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Assigned Strategy</th>
              <th className="pb-3 font-semibold">Max Accounts</th>
              <th className="pb-3 font-semibold">Expiry Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {licenses.map((lic) => (
              <tr key={lic.id} className="hover:bg-slate-900/40">
                <td className="py-3 font-bold text-amber-400 text-xs">{lic.license_key}</td>
                <td className="py-3 font-sans text-slate-200">{lic.customer_name || 'Customer'}</td>
                <td className="py-3 font-sans text-slate-300">{lic.strategy_name || 'XAUUSD 100-Block'}</td>
                <td className="py-3 text-slate-300">{lic.max_accounts || 1}</td>
                <td className="py-3 text-slate-400">{lic.expires_at}</td>
                <td className="py-3 font-sans">
                  <Badge variant={lic.status === 'ACTIVE' ? 'success' : 'danger'} size="xs">
                    {lic.status}
                  </Badge>
                </td>
                <td className="py-3 text-right font-sans">
                  <button
                    onClick={() => handleToggleStatus(lic)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      lic.status === 'ACTIVE'
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                        : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    }`}
                  >
                    {lic.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
