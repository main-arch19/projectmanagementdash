import { apiFetch } from './base';
import type { Payment, Task } from '@delroy/types';

export interface PaymentWithClient extends Payment {
  clients: { name: string; email: string | null; company: string | null } | null;
}

export interface TaskWithProject extends Task {
  projects: {
    title: string;
    client_id: string;
    clients: { name: string } | null;
  } | null;
}

export interface TodayData {
  overdue_payments: PaymentWithClient[];
  soon_due_payments: PaymentWithClient[];
  open_tasks: TaskWithProject[];
  pipeline_counts: { intake: number; in_progress: number; awaiting_payment: number; done: number };
}

export function getTodayData() {
  return apiFetch<TodayData>('/today');
}
