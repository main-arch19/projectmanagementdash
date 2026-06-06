/**
 * Agent E — Natural language query (read-only)
 * Trigger: user types a question in the Ask box
 * Answers questions about the data using SQL-backed read-only tools.
 * No writes, no proposals — just answers.
 */
import { supabase } from '../lib/supabase';
import { runAgentLoop } from './loop';
import type Anthropic from '@anthropic-ai/sdk';

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'getPaymentsSummary',
    description: 'Get payments with optional filters. Returns payments joined with client names.',
    input_schema: {
      type: 'object',
      properties: {
        status:       { type: 'string', enum: ['unpaid','sent','overdue','paid','all'] },
        overdue_only: { type: 'boolean' },
        days_since_reminder: { type: 'number', description: 'Filter by reminder sent X+ days ago' },
      },
    },
  },
  {
    name: 'getClientsWithDebt',
    description: 'Get clients who have outstanding (unpaid/sent) payments, with total owed',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getPipelineSummary',
    description: 'Get project counts by stage with total values',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'searchClientsByName',
    description: 'Find a client by name and return their projects and payment status',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'getRecentActivity',
    description: 'Get recently created or updated payments, projects, files — last N days',
    input_schema: {
      type: 'object',
      properties: { days: { type: 'number', default: 7 } },
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'getPaymentsSummary') {
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase.from('payments').select('*, clients(name, email)');
    if (input.overdue_only) query = query.in('status', ['unpaid','sent']).lt('due_date', today);
    else if (input.status && input.status !== 'all') query = query.eq('status', input.status);
    if (input.days_since_reminder) {
      const cutoff = new Date(Date.now() - Number(input.days_since_reminder) * 86400000).toISOString();
      query = query.or(`reminder_sent_at.is.null,reminder_sent_at.lt.${cutoff}`);
    }
    const { data } = await query.order('due_date');
    return data ?? [];
  }
  if (name === 'getClientsWithDebt') {
    const { data } = await supabase
      .from('payments')
      .select('client_id, amount, status, due_date, clients(name)')
      .in('status', ['unpaid', 'sent']);
    if (!data) return [];
    const byClient: Record<string, { name: string; total: number; overdue: number }> = {};
    const today = new Date();
    for (const p of data) {
      const cid = p.client_id;
      const cname = (p.clients as unknown as { name: string } | null)?.name ?? '—';
      if (!byClient[cid]) byClient[cid] = { name: cname, total: 0, overdue: 0 };
      byClient[cid].total += p.amount;
      if (p.due_date && new Date(p.due_date) < today) byClient[cid].overdue += p.amount;
    }
    return Object.values(byClient).sort((a, b) => b.overdue - a.overdue);
  }
  if (name === 'getPipelineSummary') {
    const { data } = await supabase.from('projects').select('stage, value');
    const summary: Record<string, { count: number; value: number }> = {};
    for (const p of data ?? []) {
      if (!summary[p.stage]) summary[p.stage] = { count: 0, value: 0 };
      summary[p.stage].count++;
      summary[p.stage].value += p.value ?? 0;
    }
    return summary;
  }
  if (name === 'searchClientsByName') {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, email, company, status')
      .ilike('name', `%${input.name}%`);
    if (!clients?.length) return [];
    const client = clients[0];
    const { data: projects } = await supabase.from('projects').select('*').eq('client_id', client.id);
    const { data: payments } = await supabase.from('payments').select('*').eq('client_id', client.id);
    return { client, projects: projects ?? [], payments: payments ?? [] };
  }
  if (name === 'getRecentActivity') {
    const days = Number(input.days ?? 7);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const [p, pr, f] = await Promise.all([
      supabase.from('payments').select('*, clients(name)').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(20),
      supabase.from('projects').select('*, clients(name)').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(20),
      supabase.from('files').select('*, clients(name)').gte('uploaded_at', cutoff).order('uploaded_at', { ascending: false }).limit(20),
    ]);
    return { payments: p.data ?? [], projects: pr.data ?? [], files: f.data ?? [] };
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function runNlQueryAgent(query: string): Promise<string> {
  const system = `You are a data assistant for a service business.
Answer questions about the business's clients, projects, payments, and files.
Use the available tools to look up current data. Never guess — always query.
Be concise and specific. Format numbers as currency when relevant.
Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`;

  const result = await runAgentLoop(system, query, TOOLS, executeTool);
  return result.text;
}
