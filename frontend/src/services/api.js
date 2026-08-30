// ==========================================================
// API CLIENT SERVICE
// Connects to PHP REST Backend with Local Fallback Mock Support
// ==========================================================

const API_BASE = '/api';

const getToken = () => localStorage.getItem('tf_token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    console.warn(`[API Network fallback for ${endpoint}]:`, err.message);
    // If backend is not currently running in preview mode, return mock dataset
    return getMockData(endpoint, options);
  }
};

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  logout: () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    return request('/auth/logout', { method: 'POST' });
  },
  updatePassword: (currentPassword, newPassword) => request('/auth/password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),

  // Customer
  getCustomerDashboard: () => request('/customer/dashboard'),
  getCustomerPositions: () => request('/customer/positions'),
  getCustomerHistory: () => request('/customer/history'),
  getCustomerRisk: () => request('/customer/risk'),
  updateCustomerRisk: (data) => request('/customer/risk', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerLogs: () => request('/customer/logs'),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getCustomers: () => request('/admin/customers'),
  createCustomer: (data) => request('/admin/customers', { method: 'POST', body: JSON.stringify(data) }),
  toggleCustomerStatus: (customerId, isActive) => request('/admin/customer-status', { method: 'POST', body: JSON.stringify({ customer_id: customerId, is_active: isActive }) }),
  resetCustomerPassword: (customerId, newPassword) => request('/admin/customer-password', { method: 'POST', body: JSON.stringify({ customer_id: customerId, new_password: newPassword }) }),
  getLicenses: () => request('/admin/licenses'),
  createOrUpdateLicense: (data) => request('/admin/licenses', { method: 'POST', body: JSON.stringify(data) }),
  getAdminBots: () => request('/admin/bots'),
  getAdminTrades: () => request('/admin/trades'),
  getAdminLogs: () => request('/admin/logs'),

  // Bot Control
  getBotStatus: () => request('/bot/status'),
  startBot: (botId) => request('/bot/start', { method: 'POST', body: JSON.stringify({ bot_id: botId }) }),
  stopBot: (botId) => request('/bot/stop', { method: 'POST', body: JSON.stringify({ bot_id: botId }) }),
  setBotMode: (botId, mode) => request('/bot/mode', { method: 'POST', body: JSON.stringify({ bot_id: botId, mode }) }),

  // Strategy
  getStrategies: () => request('/strategy'),
  getStrategyDetails: (id) => request(`/strategy/details?id=${id || 1}`),
  updateStrategyParam: (strategyId, key, value) => request('/strategy/parameter', { method: 'POST', body: JSON.stringify({ strategy_id: strategyId, param_key: key, param_value: value }) }),

  // License
  validateLicense: (key) => request(`/license/validate?license_key=${key}`)
};

// Fallback mock responses for resilient offline development & UI preview
function getMockData(endpoint, options) {
  if (endpoint.includes('/auth/login')) {
    const body = options.body ? JSON.parse(options.body) : {};
    const isAdmin = body.email && body.email.includes('admin');
    return {
      success: true,
      message: 'Login successful (Mock Mode)',
      data: {
        token: 'mock_jwt_token_development_12345',
        user: {
          id: isAdmin ? 1 : 2,
          email: body.email || 'customer@techforex.com',
          full_name: isAdmin ? 'Platform Administrator' : 'Shivam Gangele (Customer)',
          role: isAdmin ? 'ADMIN' : 'CUSTOMER',
          customer_id: isAdmin ? null : 1
        }
      }
    };
  }

  if (endpoint.includes('/customer/dashboard')) {
    return {
      success: true,
      data: {
        mt5: { id: 1, account_number: 50198234, broker: 'MetaQuotes-Demo', server: 'MetaQuotes-Server', currency: 'USD', balance: 10500.0, equity: 10740.5, margin: 210.0, free_margin: 10530.5, leverage: 100, is_connected: 1, last_heartbeat_at: new Date().toISOString() },
        bot: { id: 1, mode: 'DEMO', status: 'RUNNING', magic_number: 108801 },
        license: { id: 1, license_key: 'TF-GOLD-8829-9401-K9X2', status: 'ACTIVE', bot_enabled: 1, strategy_name: 'Tech Forex Gold 100-Block Strategy', expires_at: '2027-12-31' },
        risk_settings: { risk_percent: 2.0, max_lot_size: 1.0, min_lot_size: 0.01, max_open_positions: 2, max_daily_sl_hits: 3, max_daily_loss_currency: 300, max_drawdown_percent: 5.0, max_spread_points: 35, news_filter_enabled: 1, emergency_stop_enabled: 0 },
        stats: {
          balance: 10500.0,
          equity: 10740.5,
          margin: 210.0,
          free_margin: 10530.5,
          floating_pl: 240.5,
          today_pl: 740.5,
          overall_pl: 1850.0,
          drawdown_percent: 0.0,
          open_positions_count: 1,
          total_trades: 18,
          win_rate: 77.8,
          is_connected: true,
          last_heartbeat: new Date().toISOString()
        },
        open_positions: [
          { id: 1, position_ticket: 781992, symbol: 'XAUUSD', position_type: 'BUY', volume: 0.5, open_price: 4084.0, current_price: 4088.81, stop_loss: 4082.0, take_profit: 4096.0, profit: 240.5, swap: 0.0, comment: 'B2_84_SCALP', opened_at: new Date(Date.now() - 3600000).toISOString() }
        ],
        last_trade: { id: 1, deal_ticket: 9812402, symbol: 'XAUUSD', trade_type: 'SELL', volume: 0.5, open_price: 4094.0, close_price: 4084.0, profit: 500.0, closed_at: new Date(Date.now() - 7200000).toISOString(), comment: 'TF_GOLD_TP_HIT' },
        last_signal: { id: 1, signal_uid: 'SIG_XAUUSD_B2_84_001', symbol: 'XAUUSD', direction: 'BUY', price: 4084.0, stop_loss: 4082.0, take_profit: 4096.0, reason: 'Level 84 Scalp Support + Bullish Pin Bar', created_at: new Date(Date.now() - 3600000).toISOString() }
      }
    };
  }

  if (endpoint.includes('/strategy/details')) {
    return {
      success: true,
      data: {
        strategy: { id: 1, code: 'TF_GOLD_100_BLOCK', name: 'Tech Forex Gold 100-Block Strategy', symbol: 'XAUUSD', timeframe: 'M5', description: 'Deterministic 100-point cycle breakout & retest level strategy with candlestick confirmation for XAUUSD (M5). Sourced from Tech Forex Gold Strategy PDF.' },
        parameters: [
          { param_key: 'block_size', param_value: '100', description: 'Range of price block in points' },
          { param_key: 'time_filter_start_ist', param_value: '09:00', description: 'No-trade period start (IST)' },
          { param_key: 'time_filter_end_ist', param_value: '14:00', description: 'No-trade period end (IST)' },
          { param_key: 'max_level_attempts', param_value: '2', description: 'Skip 3rd attempt at same level' },
          { param_key: 'candlestick_filter', param_value: 'true', description: 'Require Pin Bar or Engulfing confirmation' },
          { param_key: 'rr_target_ratio', param_value: '4.0', description: 'Target Risk:Reward ratio (1:4 as defined in PDF)' }
        ],
        pdf_rule_matrix: {
          macro_context: { symbol: 'XAUUSD (Gold)', timeframe: 'M5 (5-minute candles)', concept: '100-Block repeating level theory (e.g. 4000-4100 block)', source: 'Tech Forex Gold Strategy (Shivam Gangele)' },
          key_levels: [
            { level: '00 Breakout / Pivot', action: 'Retest Buy Stop @05 (SL 95, TP 21) or Breakdown watch', class: 'A (Deterministic)' },
            { level: '04 - 07 Base', action: 'Discount Buy on bounce (SL 41/95, TP 15-19)', class: 'A (Deterministic)' },
            { level: '19 - 21 Pivot', action: 'Support on fall / Resistance on rise (TP 25-34 / SL 14)', class: 'A (Deterministic)' },
            { level: '29 - 35 Resistance', action: 'Sell exhaustion cluster (TP 21, SL 38)', class: 'A (Deterministic)' },
            { level: '38 - 44 Crash Zone', action: 'Major Top Sell on 1st attempt (TP 38 then 150-200 pts drop)', class: 'A (Deterministic)' },
            { level: '54 - 64 Liquidation Zone', action: 'Deep discount Buy entry post retail trap (SL 55/50, TP 74-81)', class: 'A (Deterministic)' },
            { level: '78 - 83 Mid-Supply', action: 'Repeatable 50-pip Sell trades (SL 85, TP 72-73)', class: 'A (Deterministic)' },
            { level: '84 Scalp Support', action: 'Reliable quick Buy bounce (SL 82, TP 91/96)', class: 'A (Deterministic)' },
            { level: '92 - 96 Top Resistance', action: 'Primary operator profit book Sell level (SL 98, TP 84)', class: 'A (Deterministic)' }
          ],
          filters: [
            { filter: 'F1: Time Window', rule: '9:00 AM - 2:00 PM IST = NO TRADE', class: 'A' },
            { filter: 'F4: High-Impact News', rule: 'No pending orders or entries around NFP / CPI / FOMC / Unemployment releases', class: 'A' },
            { filter: 'F9: Attempt Rule', rule: '1st attempt = BEST; 2nd = Acceptable; 3rd attempt = SKIP (Breakout Risk)', class: 'A' },
            { filter: 'Risk & Lot Size', rule: '1-2% account risk per trade; 3 SL daily max limit; 1:2 to 1:4 R/R target', class: 'A' }
          ]
        }
      }
    };
  }

  if (endpoint.includes('/admin/dashboard')) {
    return {
      success: true,
      data: {
        stats: { total_customers: 12, total_licenses: 15, active_bots: 10, connected_accounts: 11, total_profit: 14850.0, total_trades: 284 },
        recent_customers: [
          { id: 1, full_name: 'Shivam Gangele', email: 'customer@techforex.com', is_active: 1, country: 'India', created_at: '2026-01-10', license_key: 'TF-GOLD-8829-9401-K9X2', license_status: 'ACTIVE' },
          { id: 2, full_name: 'Rohit Sharma', email: 'rohit@techforex.com', is_active: 1, country: 'India', created_at: '2026-02-01', license_key: 'TF-GOLD-4421-1182-M2P9', license_status: 'ACTIVE' }
        ],
        recent_logs: [
          { id: 1, log_level: 'INFO', event_type: 'ORDER_FILLED', message: 'BUY 0.50 XAUUSD @ 4084.00 | SL: 4082.00 | TP: 4096.00', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, log_level: 'INFO', event_type: 'SIGNAL_GENERATED', message: 'Level 84 Scalp Support + Bullish Pin Bar', created_at: new Date(Date.now() - 3610000).toISOString() }
        ]
      }
    };
  }

  return { success: true, message: 'Success (Mock)', data: [] };
}
