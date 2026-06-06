import { apiFetch } from './base';
import type { Task, CreateTaskDto, UpdateTaskDto } from '@delroy/types';

export function listTasks(filters?: { project_id?: string; done?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.project_id)          params.set('project_id', filters.project_id);
  if (filters?.done !== undefined)  params.set('done',        String(filters.done));
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<Task[]>(`/tasks${qs}`);
}

export function createTask(body: CreateTaskDto) {
  return apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) });
}

export function updateTask(id: string, body: UpdateTaskDto) {
  return apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function completeTask(id: string) {
  return apiFetch<Task>(`/tasks/${id}/complete`, { method: 'POST' });
}

export function deleteTask(id: string) {
  return apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' });
}
