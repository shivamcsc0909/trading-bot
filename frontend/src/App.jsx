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
import { HelpView } from './pages/customer/HelpView';

// Admin Views
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { CustomersView } from './pages/admin/CustomersView';
import { LicensesView } from './pages/admin/LicensesView';
import { BotMonitorView } from './pages/admin/BotMonitorView';
import { StrategiesAdminView } from './pages/admin/StrategiesAdminView';
import { AllTradesView } from './pages/admin/AllTradesView';

export function App() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin-dashboard' : 'dashboard');
  const [customerData, setCustomerData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        "CRITICAL LIVE TRADING CONFIRMATION:\n\n" +
        "You are about to switch from DEMO / Paper Trading to LIVE REAL-MONEY TRADING.\n\n" +
        "1. Verify that your MT5 terminal is connected.\n" +
        "2. Ensure you have tested the strategy on demo.\n" +
        "3. Confirm your Risk Parameters (Risk % and Stop Loss limits).\n\n" +
        "Do you explicitly authorize the bot to execute live orders on your MT5 account?"
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
        return (
          <DashboardView
            data={customerData}
            onToggleBot={handleToggleBot}
            onToggleMode={handleToggleMode}
            onRefresh={loadCustomerData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
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
      case 'help':
        return <HelpView />;
      case 'profile':
        return <ProfileView data={customerData} />;
      case 'logs':
        return <LogsView />;

      // Admin Routes
      case 'admin-dashboard':
        return <AdminDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'admin-customers':
        return <CustomersView />;
      case 'admin-bots':
        return <BotMonitorView />;
      case 'admin-strategies':
        return <StrategiesAdminView />;
      case 'admin-licenses':
        return <LicensesView />;
      case 'admin-trades':
        return <AllTradesView type="trades" />;
      case 'admin-logs':
        return <AllTradesView type="logs" />;

      default:
        return (
          <DashboardView
            data={customerData}
            onToggleBot={handleToggleBot}
            onToggleMode={handleToggleMode}
            onRefresh={loadCustomerData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
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
        onOpenHelp={() => setActiveTab(isAdmin ? 'admin-logs' : 'help')}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
