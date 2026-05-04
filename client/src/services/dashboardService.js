import api from './api.js';

export async function fetchDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}
