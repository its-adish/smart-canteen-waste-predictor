import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canteen_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear localStorage
      // Avoid redirect loops if already on login
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login-json', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const menuAPI = {
  getAll: (category = null, activeOnly = true) => 
    api.get('/menu', { params: { category, active_only: activeOnly } }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (itemData) => api.post('/menu', itemData),
  update: (id, itemData) => api.put(`/menu/${id}`, itemData),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const recordsAPI = {
  getAll: (params) => api.get('/records', { params }),
  getById: (id) => api.get(`/records/${id}`),
  create: (recordData) => api.post('/records', recordData),
  update: (id, recordData) => api.put(`/records/${id}`, recordData),
  delete: (id) => api.delete(`/records/${id}`),
  importCSV: (formData) => api.post('/records/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportCSVUrl: (startDate, endDate) => {
    let url = '/api/v1/records/export-csv';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  },
  templateCSVUrl: () => '/api/v1/records/template-csv',
};

export const predictionsAPI = {
  generateBatch: (batchData) => api.post('/predictions/batch', batchData),
  savePlan: (planData) => api.post('/predictions/save-plan', planData),
  getHistory: (params) => api.get('/predictions/history', { params }),
};

export const feedbackAPI = {
  getPending: () => api.get('/feedback/pending'),
  submitActuals: (feedbackData) => api.post('/feedback/submit', feedbackData),
};

export const modelAPI = {
  getSummary: () => api.get('/model/summary'),
  train: (trainConfig) => api.post('/model/train', trainConfig),
};

export const analyticsAPI = {
  getKPIs: (days = 30) => api.get('/analytics/kpis', { params: { days } }),
  getTrends: (days = 30) => api.get('/analytics/trends', { params: { days } }),
  getWasteByCategory: () => api.get('/analytics/waste-by-category'),
  getAlerts: () => api.get('/analytics/alerts'),
  getSustainability: () => api.get('/analytics/sustainability'),
};

export default api;
