// ==========================================================
// FXTRADER REST API CLIENT SERVICE
// Real Authentication & Backend Communication Layer
// ==========================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('tf_token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkErr) {
    console.error(`[API Network Error for ${endpoint}]:`, networkErr);
    throw new Error('Unable to connect to the server. Please check your backend connection.');
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    if (!res.ok) {
      throw new Error(`Server returned HTTP status ${res.status}`);
    }
    throw new Error('Invalid JSON response received from server.');
  }

  if (!res.ok) {
    const errorMsg = data?.message || (res.status === 401 ? 'Invalid email or password credentials.' : res.status === 403 ? 'Access forbidden or account suspended.' : 'API request failed');
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  // Authentication
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  logout: () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    return request('/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
  },
  updatePassword: (currentPassword, newPassword) => request('/auth/password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),

  // Customer Panel
  getCustomerDashboard: () => request('/customer/dashboard'),
  getCustomerPositions: () => request('/customer/positions'),
  getCustomerHistory: () => request('/customer/history'),
  getCustomerRisk: () => request('/customer/risk'),
  updateCustomerRisk: (data) => request('/customer/risk', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerLogs: () => request('/customer/logs'),

  // Admin Customer Lifecycle
  getAdminDashboard: () => request('/admin/dashboard'),
  getCustomers: (includeArchived = false) => request(`/admin/customers${includeArchived ? '?archived=1' : ''}`),
  createCustomer: (data) => request('/admin/customers', { method: 'POST', body: JSON.stringify(data) }),
  toggleCustomerStatus: (customerId, isActive) => request('/admin/customer-status', { method: 'POST', body: JSON.stringify({ customer_id: customerId, is_active: isActive }) }),
  archiveCustomer: (customerId) => request('/admin/customer-archive', { method: 'POST', body: JSON.stringify({ customer_id: customerId }) }),
  restoreCustomer: (customerId) => request('/admin/customer-restore', { method: 'POST', body: JSON.stringify({ customer_id: customerId }) }),
  assignCustomerStrategy: (customerId, strategyId) => request('/admin/customer-strategy', { method: 'POST', body: JSON.stringify({ customer_id: customerId, strategy_id: strategyId }) }),
  resetCustomerPassword: (customerId, newPassword) => request('/admin/customer-password', { method: 'POST', body: JSON.stringify({ customer_id: customerId, new_password: newPassword }) }),

  // Admin Licenses
  getLicenses: () => request('/admin/licenses'),
  createOrUpdateLicense: (data) => request('/admin/licenses', { method: 'POST', body: JSON.stringify(data) }),

  // Admin Fleet Monitoring & System Logs
  getAdminBots: () => request('/admin/bots'),
  getAdminTrades: () => request('/admin/trades'),
  getAdminLogs: () => request('/admin/logs'),

  // Bot Master Controls
  getBotStatus: () => request('/bot/status'),
  startBot: (botId) => request('/bot/start', { method: 'POST', body: JSON.stringify({ bot_id: botId }) }),
  stopBot: (botId) => request('/bot/stop', { method: 'POST', body: JSON.stringify({ bot_id: botId }) }),
  setBotMode: (botId, mode) => request('/bot/mode', { method: 'POST', body: JSON.stringify({ bot_id: botId, mode }) }),

  // Strategy Catalog & Parameter Tuning
  getStrategies: () => request('/strategy'),
  getStrategyDetails: (id) => request(`/strategy/details?id=${id || 1}`),
  createStrategy: (data) => request('/strategy/create', { method: 'POST', body: JSON.stringify(data) }),
  updateStrategy: (data) => request('/strategy/update', { method: 'POST', body: JSON.stringify(data) }),
  duplicateStrategy: (strategyId) => request('/strategy/duplicate', { method: 'POST', body: JSON.stringify({ strategy_id: strategyId }) }),
  toggleStrategyStatus: (strategyId, isActive) => request('/strategy/status', { method: 'POST', body: JSON.stringify({ strategy_id: strategyId, is_active: isActive }) }),
  updateStrategyParam: (strategyId, key, value) => request('/strategy/parameter', { method: 'POST', body: JSON.stringify({ strategy_id: strategyId, param_key: key, param_value: value }) }),

  // License Validation
  validateLicense: (key) => request(`/license/validate?license_key=${key}`)
};
