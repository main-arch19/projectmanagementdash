import { apiFetch } from './base';
import type { AgentAction } from '@delroy/types';

export function listAgentActions(status?: 'pending' | 'approved' | 'dismissed') {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<AgentAction[]>(`/agent-actions${qs}`);
}

export function approveAgentAction(id: string, overrides?: Record<string, unknown>) {
  return apiFetch<AgentAction>(`/agent-actions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ overrides }),
  });
}

export function dismissAgentAction(id: string) {
  return apiFetch<AgentAction>(`/agent-actions/${id}/dismiss`, { method: 'POST' });
}

export function runNlUpdate(text: string) {
  return apiFetch<AgentAction[]>('/agent-actions/nl-update', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function runNlQuery(query: string) {
  return apiFetch<{ answer: string }>('/agent-actions/nl-query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
