import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import {
  Layers,
  Plus,
  Copy,
  Edit2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Save,
  BookOpen,
  Info,
  ArrowRight
} from 'lucide-react';

export const StrategiesAdminView = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [msg, setMsg] = useState('');

  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    symbol: 'XAUUSD',
    timeframe: 'M5',
    version: '1.0',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    version: '1.0',
    description: ''
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setLoading(false);
    const res = await api.getStrategies();
    if (res.success && res.data?.strategies) {
      setStrategies(res.data.strategies);
      if (res.data.strategies.length > 0 && !selectedStrategy) {
        setSelectedStrategy(res.data.strategies[0]);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.createStrategy(createForm);
      if (res.success) {
        setMsg(`Strategy "${createForm.name}" created successfully.`);
        setShowAddModal(false);
        setCreateForm({ code: '', name: '', symbol: 'XAUUSD', timeframe: 'M5', version: '1.0', description: '' });
        loadStrategies();
      }
    } catch (err) {
      alert('Error creating strategy: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedStrategy) return;
    try {
      const res = await api.updateStrategy({
        strategy_id: selectedStrategy.id,
        ...editForm
      });
      if (res.success) {
        setMsg(`Strategy "${editForm.name}" updated.`);
        setShowEditModal(false);
        loadStrategies();
      }
    } catch (err) {
      alert('Error updating strategy: ' + err.message);
    }
  };

  const handleDuplicate = async (strat) => {
    const res = await api.duplicateStrategy(strat.id);
    if (res.success) {
      setMsg(`Duplicated strategy as ${res.data?.code}`);
      loadStrategies();
    }
  };

  const handleToggleStatus = async (strat) => {
    const nextActive = strat.is_active ? 0 : 1;
    await api.toggleStrategyStatus(strat.id, nextActive);
    loadStrategies();
  };

  const handleParamUpdate = async (stratId, key, val) => {
    await api.updateStrategyParam(stratId, key, val);
    setMsg(`Parameter ${key} saved.`);
    loadStrategies();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Strategy Engine & Parameters</h1>
          <p className="text-xs text-slate-400 mt-1">Configure trading strategies, version numbers, and algorithmic parameters without editing code.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStrategies}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="gold-gradient hover:opacity-95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} />
            <span>Create Strategy</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{msg}</span>
        </div>
      )}

      {/* Strategies Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Strategies</h2>
          {strategies.map((strat) => {
            const isSelected = selectedStrategy?.id === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-100">{strat.name}</div>
                  <Badge variant={strat.is_active ? 'success' : 'default'} size="xs">
                    {strat.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-amber-400 mt-1">
                  {strat.code} • v{strat.version || '1.0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {strat.symbol} ({strat.timeframe})
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Strategy Details & Parameter Tuner */}
        {selectedStrategy && (
          <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100">{selectedStrategy.name}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                    v{selectedStrategy.version || '1.0'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedStrategy.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditForm({
                      name: selectedStrategy.name,
                      version: selectedStrategy.version || '1.0',
                      description: selectedStrategy.description || ''
                    });
                    setShowEditModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDuplicate(selectedStrategy)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1"
                >
                  <Copy size={13} /> Duplicate
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedStrategy)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    selectedStrategy.is_active
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                  }`}
                >
                  {selectedStrategy.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Configurable Parameters Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders size={16} className="text-amber-400" />
                <span>Configurable Strategy Parameters (Applied in EA Engine)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-sans">
                      <th className="pb-2">Parameter Key</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(selectedStrategy.parameters || []).map((p) => (
                      <ParamRow
                        key={p.param_key}
                        strategyId={selectedStrategy.id}
                        param={p}
                        onSave={handleParamUpdate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Strategy */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-100">Add New Strategy</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XAUUSD Breakout v2"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unique Code</label>
                  <input
                    type="text"
                    required
                    placeholder="TF_GOLD_V2"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Version</label>
                  <input
                    type="text"
                    value={createForm.version}
                    onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Symbol</label>
                  <input
                    type="text"
                    value={createForm.symbol}
                    onChange={(e) => setCreateForm({ ...createForm, symbol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Timeframe</label>
                  <input
                    type="text"
                    value={createForm.timeframe}
                    onChange={(e) => setCreateForm({ ...createForm, timeframe: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Strategy rules and notes..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient text-slate-950 font-bold px-4 py-1.5 rounded-lg shadow-md"
                >
                  Save Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Strategy */}
      {showEditModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-100">Edit Strategy Details</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Version Number</label>
                <input
                  type="text"
                  required
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient text-slate-950 font-bold px-4 py-1.5 rounded-lg shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline editable parameter row
const ParamRow = ({ strategyId, param, onSave }) => {
  const [val, setVal] = useState(param.param_value);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    onSave(strategyId, param.param_key, val);
    setIsDirty(false);
  };

  return (
    <tr className="hover:bg-slate-900/40">
      <td className="py-2.5 text-slate-300">{param.param_key}</td>
      <td className="py-2.5">
        <input
          type="text"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setIsDirty(true);
          }}
          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs w-32 focus:border-amber-500 focus:outline-none"
        />
      </td>
      <td className="py-2.5 text-slate-400 font-sans text-[11px]">{param.description || '—'}</td>
      <td className="py-2.5 text-right font-sans">
        {isDirty && (
          <button
            onClick={handleSave}
            className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold inline-flex items-center gap-1"
          >
            <Save size={11} /> Save
          </button>
        )}
      </td>
    </tr>
  );
};
