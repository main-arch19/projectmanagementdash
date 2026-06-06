import { apiFetch } from './base';
import type { Project, CreateProjectDto, UpdateProjectDto, ProjectStage } from '@delroy/types';

export function listProjects(filters?: { client_id?: string; stage?: ProjectStage }) {
  const params = new URLSearchParams();
  if (filters?.client_id) params.set('client_id', filters.client_id);
  if (filters?.stage)     params.set('stage', filters.stage);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<Project[]>(`/projects${qs}`);
}

export function getProject(id: string) {
  return apiFetch<Project>(`/projects/${id}`);
}

export function createProject(body: CreateProjectDto) {
  return apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify(body) });
}

export function updateProject(id: string, body: UpdateProjectDto & { stage?: ProjectStage }) {
  return apiFetch<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteProject(id: string) {
  return apiFetch<void>(`/projects/${id}`, { method: 'DELETE' });
}
