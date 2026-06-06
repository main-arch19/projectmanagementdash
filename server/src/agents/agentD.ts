/**
 * Agent D — Natural language pipeline update
 * Trigger: user types a sentence like "finished design for Acme, they paid the deposit"
 * Parses the sentence into proposed changes, stores agent_action records,
 * presents them as confirmation cards. Human approves → changes applied.
 */
import { supabase } from '../lib/supabase';
import { runAgentLoop } from './loop';
import type Anthropic from '@anthropic-ai/sdk';

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'searchClients',
    description: 'Find clients by name (fuzzy)',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'getProjectsForClient',
    description: 'Get projects for a client ID',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'proposeStageUpdate',
    description: 'Propose updating a project stage (requires human confirmation)',
    input_schema: {
      type: 'object',
      properties: {
        project_id:   { type: 'string' },
        project_title:{ type: 'string' },
        new_stage:    { type: 'string', enum: ['intake', 'in_progress', 'awaiting_payment', 'done'] },
        display_text: { type: 'string' },
      },
      required: ['project_id', 'project_title', 'new_stage', 'display_text'],
    },
  },
  {
    name: 'proposeMarkPaid',
    description: 'Propose marking a payment as paid (requires human confirmation)',
    input_schema: {
      type: 'object',
      properties: {
        payment_id:   { type: 'string' },
        amount:       { type: 'number' },
        client_name:  { type: 'string' },
        display_text: { type: 'string' },
      },
      required: ['payment_id', 'amount', 'client_name', 'display_text'],
    },
  },
  {
    name: 'proposeCreateTask',
    description: 'Propose creating a task (requires human confirmation)',
    input_schema: {
      type: 'object',
      properties: {
        project_id:   { type: 'string' },
        title:        { type: 'string' },
        reason:       { type: 'string' },
        display_text: { type: 'string' },
      },
      required: ['project_id', 'title', 'display_text'],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'searchClients') {
    const { data } = await supabase
      .from('clients')
      .select('id, name, company')
      .ilike('name', `%${input.query}%`)
      .limit(5);
    return data ?? [];
  }
  if (name === 'getProjectsForClient') {
    const { data } = await supabase
      .from('projects')
      .select('id, title, stage, payments(id, amount, status)')
      .eq('client_id', input.client_id);
    return data ?? [];
  }
  if (name === 'proposeStageUpdate') {
    const { data, error } = await supabase
      .from('agent_actions')
      .insert({
        type: 'update_stage',
        payload: { project_id: input.project_id, new_stage: input.new_stage },
        display_text: input.display_text,
        status: 'pending',
      })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  if (name === 'proposeMarkPaid') {
    const { data, error } = await supabase
      .from('agent_actions')
      .insert({
        type: 'mark_paid',
        payload: { payment_id: input.payment_id },
        display_text: input.display_text,
        status: 'pending',
      })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  if (name === 'proposeCreateTask') {
    const { data, error } = await supabase
      .from('agent_actions')
      .insert({
        type: 'create_task',
        payload: { project_id: input.project_id, title: input.title, reason: input.reason ?? null },
        display_text: input.display_text,
        status: 'pending',
      })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function runNlUpdateAgent(text: string) {
  const system = `You are a pipeline update assistant for a service business.
The user will describe work they've done or events that happened.
Your job: parse the description, look up the relevant clients/projects/payments, and propose the appropriate database changes as agent_action records.
Each proposed change becomes a confirmation card the user approves or dismisses.
Be conservative: only propose changes you are confident about. If ambiguous, propose nothing and explain why.`;

  const userMessage = `The user said: "${text}"
Parse this, identify clients and projects involved, and propose the appropriate changes.`;

  return runAgentLoop(system, userMessage, TOOLS, executeTool);
}
