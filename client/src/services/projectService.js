import api from './api.js';

export async function fetchProjects() {
  const { data } = await api.get('/projects');
  return data.projects;
}

export async function fetchProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data.project;
}

/** @returns {Promise<Array<{ _id: string, name: string, email: string }>>} */
export async function fetchProjectMembers(projectId) {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
}

export async function createProject(body) {
  const { data } = await api.post('/projects', body);
  return data.project;
}

export async function updateProject(id, body) {
  const { data } = await api.put(`/projects/${id}`, body);
  return data.project;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}
