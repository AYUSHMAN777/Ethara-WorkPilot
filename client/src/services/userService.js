import api from './api.js';

/** Admin-only. Returns `{ _id, name, email }[]`. Optional `search`, `limit`. */
export async function fetchAllUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return Array.isArray(data) ? data : [];
}
