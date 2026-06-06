/**
 * Agent C — Daily planner
 * Trigger: daily schedule (early morning)
 * Reads all open tasks and overdue payments, ranks them by priority
 * (overdue money first, then deadline risk), writes priority + reason
 * back to each task. The Today screen shows the result.
 */
import { supabase } from '../lib/supabase';
import { runAgentLoop } from './loop';
import type Anthropic from '@anthropic-ai/sdk';

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'getOpenTasks',
    description: 'Get all open (not done) tasks with their project and client info',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getOverduePayments',
    description: 'Get all overdue payments with client names',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getUpcomingDeadlines',
    description: 'Get projects with due dates in the next 14 days',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'setTaskPriority',
    description: 'Set priority (1 = highest) and reason on a task. This writes directly — no confirmation needed for prioritization.',
    input_schema: {
      type: 'object',
      properties: {
        task_id:  { type: 'string' },
        priority: { type: 'number', description: '1 = most urgent' },
        reason:   { type: 'string', description: 'One-line explanation shown to user' },
      },
      required: ['task_id', 'priority', 'reason'],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'getOpenTasks') {
    const { data } = await supabase
      .from('tasks')
      .select('*, projects(title, due_date, client_id, clients(name))')
      .eq('done', false);
    return data ?? [];
  }
  if (name === 'getOverduePayments') {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('payments')
      .select('*, clients(name)')
      .in('status', ['unpaid', 'sent'])
      .lt('due_date', today);
    return data ?? [];
  }
  if (name === 'getUpcomingDeadlines') {
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .gte('due_date', today)
      .lte('due_date', soon)
      .neq('stage', 'done');
    return data ?? [];
  }
  if (name === 'setTaskPriority') {
    const { data, error } = await supabase
      .from('tasks')
      .update({ priority: input.priority, reason: input.reason })
      .eq('id', input.task_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function runDailyPlannerAgent() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const system = `You are a daily planning assistant for a service business owner.
Today is ${today}.
Your job: rank all open tasks by urgency and write a one-line reason for each.
Priority rules (in order):
1. Tasks linked to overdue payments (money at risk)
2. Tasks for projects with deadlines this week
3. Tasks for projects with deadlines next week
4. Everything else by due_date, then creation order
Write the reason as if explaining to the business owner why this matters today.
Keep reasons under 10 words. Be specific: "Acme payment 14 days overdue" not "important task".`;

  const userMessage = `Plan today's work for me.
1. Call getOverduePayments, getOpenTasks, getUpcomingDeadlines in parallel.
2. Rank every open task and call setTaskPriority on each one.
3. Summarize what you did.`;

  return runAgentLoop(system, userMessage, TOOLS, executeTool);
}
