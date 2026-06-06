import { apiFetch, apiUpload } from './base';
import type { ProjectFile, UpdateFileDto } from '@delroy/types';

export function listFiles(filters?: { client_id?: string; project_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.client_id)  params.set('client_id',  filters.client_id);
  if (filters?.project_id) params.set('project_id', filters.project_id);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<ProjectFile[]>(`/files${qs}`);
}

export function getFile(id: string) {
  return apiFetch<ProjectFile>(`/files/${id}`);
}

export function uploadFile(params: {
  file: File;
  client_id: string;
  project_id?: string;
  category?: string;
}) {
  const form = new FormData();
  form.append('file', params.file);
  form.append('client_id', params.client_id);
  if (params.project_id) form.append('project_id', params.project_id);
  if (params.category)   form.append('category',   params.category);
  return apiUpload<ProjectFile>('/files/upload', form);
}

export function updateFile(id: string, body: UpdateFileDto) {
  return apiFetch<ProjectFile>(`/files/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteFile(id: string) {
  return apiFetch<void>(`/files/${id}`, { method: 'DELETE' });
}
