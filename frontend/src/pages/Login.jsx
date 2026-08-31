import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import { TelegramIcon } from '../components/TelegramIcon';
import { Cpu, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Globe, ArrowLeft } from 'lucide-react';

export const Login = ({ onGoToGuest }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('customer@techforex.com');
  const [password, setPassword] = useState('Customer@123456');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const setCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {onGoToGuest && (
          <button
            onClick={onGoToGuest}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 font-semibold transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Public Overview</span>
          </button>
        )}

        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-amber-500/20 mb-4">
              <Cpu className="h-8 w-8 text-slate-950 font-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tight gold-text">{APP_CONFIG.COMPANY_NAME}</h1>
            <p className="text-xs text-slate-400 mt-1">{APP_CONFIG.TAGLINE} (MT5 Connector)</p>
          </div>

          {/* Quick Credential Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setCredentials('customer@techforex.com', 'Customer@123456')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                email === 'customer@techforex.com'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => setCredentials('admin@techforex.com', 'Admin@123456')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                email === 'admin@techforex.com'
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 gold-gradient hover:opacity-95 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* External Links */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <a
              href={APP_CONFIG.WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-amber-400 transition"
            >
              <Globe size={13} className="text-amber-400" />
              <span>fxtraderinfo.com</span>
            </a>

            <a
              href={APP_CONFIG.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-sky-400 transition text-sky-400"
            >
              <TelegramIcon size={13} />
              <span>Telegram Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
