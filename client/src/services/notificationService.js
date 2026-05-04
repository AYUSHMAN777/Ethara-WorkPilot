import api from './api.js';

export async function fetchNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.notification;
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
