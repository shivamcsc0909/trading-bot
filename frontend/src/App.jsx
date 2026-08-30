import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';

// Customer Views
import { DashboardView } from './pages/customer/DashboardView';
import { BotView } from './pages/customer/BotView';
import { Mt5View } from './pages/customer/Mt5View';
import { StrategyView } from './pages/customer/StrategyView';
import { PositionsView } from './pages/customer/PositionsView';
import { HistoryView } from './pages/customer/HistoryView';
import { RiskView } from './pages/customer/RiskView';
import { ProfileView } from './pages/customer/ProfileView';
import { LogsView } from './pages/customer/LogsView';

// Admin Views
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { CustomersView } from './pages/admin/CustomersView';
import { LicensesView } from './pages/admin/LicensesView';
import { BotMonitorView } from './pages/admin/BotMonitorView';
import { AllTradesView } from './pages/admin/AllTradesView';

export function App() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin-dashboard' : 'dashboard');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setActiveTab(isAdmin ? 'admin-dashboard' : 'dashboard');
      loadCustomerData();
    }
  }, [user, isAdmin]);

  const loadCustomerData = async () => {
    setLoading(false);
    const res = await api.getCustomerDashboard();
    if (res.success && res.data) {
      setCustomerData(res.data);
    }
  };

  const handleToggleBot = async () => {
    if (!customerData?.bot?.id) return;
    const isRunning = customerData.bot.status === 'RUNNING';
    if (isRunning) {
      await api.stopBot(customerData.bot.id);
    } else {
      await api.startBot(customerData.bot.id);
    }
    loadCustomerData();
  };

  const handleToggleMode = async () => {
    if (!customerData?.bot?.id) return;
    const currentMode = customerData.bot.mode || 'DEMO';
    const nextMode = currentMode === 'DEMO' ? 'LIVE' : 'DEMO';
    if (nextMode === 'LIVE') {
      const confirmLive = window.confirm(
        "WARNING: You are about to switch to LIVE TRADING.\n\nEnsure you have verified demo performance and configured appropriate Risk Limits.\n\nProceed?"
      );
      if (!confirmLive) return;
    }
    await api.setBotMode(customerData.bot.id, nextMode);
    loadCustomerData();
  };

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      // Customer Routes
      case 'dashboard':
        return <DashboardView data={customerData} onToggleBot={handleToggleBot} onToggleMode={handleToggleMode} onRefresh={loadCustomerData} />;
      case 'bot':
        return <BotView data={customerData} onToggleBot={handleToggleBot} onToggleMode={handleToggleMode} onRefresh={loadCustomerData} />;
      case 'mt5':
        return <Mt5View data={customerData} />;
      case 'strategy':
        return <StrategyView />;
      case 'positions':
        return <PositionsView data={customerData} onRefresh={loadCustomerData} />;
      case 'history':
        return <HistoryView />;
      case 'risk':
        return <RiskView data={customerData} onRefresh={loadCustomerData} />;
      case 'profile':
        return <ProfileView data={customerData} />;
      case 'logs':
        return <LogsView />;

      // Admin Routes
      case 'admin-dashboard':
        return <AdminDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'admin-customers':
        return <CustomersView />;
      case 'admin-licenses':
        return <LicensesView />;
      case 'admin-bots':
        return <BotMonitorView />;
      case 'admin-strategies':
        return <StrategyView />;
      case 'admin-trades':
        return <AllTradesView type="trades" />;
      case 'admin-logs':
        return <AllTradesView type="logs" />;

      default:
        return <DashboardView data={customerData} onToggleBot={handleToggleBot} onToggleMode={handleToggleMode} onRefresh={loadCustomerData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar
        botData={{
          status: customerData?.bot?.status,
          mode: customerData?.bot?.mode,
          is_connected: customerData?.mt5?.is_connected
        }}
        onToggleBot={handleToggleBot}
        onToggleMode={handleToggleMode}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
