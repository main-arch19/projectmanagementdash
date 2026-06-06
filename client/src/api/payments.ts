import { apiFetch } from './base';
import type { Payment, CreatePaymentDto, UpdatePaymentDto, PaymentStatus } from '@delroy/types';

export function listPayments(filters?: { client_id?: string; project_id?: string; status?: PaymentStatus }) {
  const params = new URLSearchParams();
  if (filters?.client_id)  params.set('client_id',  filters.client_id);
  if (filters?.project_id) params.set('project_id', filters.project_id);
  if (filters?.status)     params.set('status',     filters.status);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<Payment[]>(`/payments${qs}`);
}

export function getPayment(id: string) {
  return apiFetch<Payment>(`/payments/${id}`);
}

export function createPayment(body: CreatePaymentDto) {
  return apiFetch<Payment>('/payments', { method: 'POST', body: JSON.stringify(body) });
}

export function updatePayment(id: string, body: UpdatePaymentDto) {
  return apiFetch<Payment>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function markPaid(id: string) {
  return apiFetch<Payment>(`/payments/${id}/mark-paid`, { method: 'POST' });
}

export function sendReminder(id: string, subject: string, body: string) {
  return apiFetch<Payment>(`/payments/${id}/send-reminder`, {
    method: 'POST',
    body: JSON.stringify({ subject, body }),
  });
}

export function deletePayment(id: string) {
  return apiFetch<void>(`/payments/${id}`, { method: 'DELETE' });
}
