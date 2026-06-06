import { apiFetch } from './base';
import type { Client, CreateClientDto, UpdateClientDto, ClientStatus } from '@delroy/types';

export function listClients(status?: ClientStatus) {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<Client[]>(`/clients${qs}`);
}

export function getClient(id: string) {
  return apiFetch<Client>(`/clients/${id}`);
}

export function createClient(body: CreateClientDto) {
  return apiFetch<Client>('/clients', { method: 'POST', body: JSON.stringify(body) });
}

export function updateClient(id: string, body: UpdateClientDto) {
  return apiFetch<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function archiveClient(id: string) {
  return apiFetch<Client>(`/clients/${id}`, { method: 'DELETE' });
}
