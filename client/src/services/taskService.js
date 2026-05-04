import api from './api.js';

export async function fetchTasksForProject(projectId) {
  const { data } = await api.get(`/tasks/project/${projectId}`);
  return data.tasks;
}

export async function createTask(body) {
  const { data } = await api.post('/tasks', body);
  return data.task;
}

export async function updateTask(id, body) {
  const { data } = await api.put(`/tasks/${id}`, body);
  return data.task;
}

export async function updateTaskStatus(id, status) {
  const { data } = await api.put(`/tasks/${id}/status`, { status });
  return data.task;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}
