import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 auto-refresh ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth API ────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (data) => api.post('/auth/refresh', data),
  setUpiPin:(data) => api.post('/auth/set-upi-pin', data),
};

// ── Wallet API ──────────────────────────────────────────────────
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
};

// ── Transaction API ─────────────────────────────────────────────
export const transactionAPI = {
  transfer:   (data) => api.post('/transactions/transfer', data),
  addMoney:   (data) => api.post('/transactions/add-money', data),
  getHistory: (page = 0, size = 20) => api.get(`/transactions/history?page=${page}&size=${size}`),
  getByRef:   (ref)  => api.get(`/transactions/${ref}`),
};

// ── Bank Account API ─────────────────────────────────────────────
export const bankAPI = {
  getAccounts:   () => api.get('/bank-accounts'),
  linkAccount:   (data) => api.post('/bank-accounts', data),
  removeAccount: (id)   => api.delete(`/bank-accounts/${id}`),
};

// ── Admin API ────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:  () => api.get('/admin/dashboard'),
  getUsers:      (page = 0, size = 20) => api.get(`/admin/users?page=${page}&size=${size}`),
  getFlagged:    (page = 0, size = 20) => api.get(`/admin/transactions/flagged?page=${page}&size=${size}`),
  freezeUser:    (id) => api.patch(`/admin/users/${id}/freeze`),
  unfreezeUser:  (id) => api.patch(`/admin/users/${id}/unfreeze`),
};
