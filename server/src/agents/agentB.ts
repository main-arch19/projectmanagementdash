/**
 * Agent B — Payment reminder drafter
 * Trigger: daily schedule (cron)
 * Finds overdue/near-due payments not reminded recently, drafts an email,
 * stores a draft_reminder agent_action. Human approves → email sends.
 * NEVER auto-sends. Always creates a pending action for confirmation.
 */
import { supabase } from '../lib/supabase';
import { runAgentLoop } from './loop';
import type Anthropic from '@anthropic-ai/sdk';

const REMINDER_COOLDOWN_DAYS = 5;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'getPaymentsNeedingReminder',
    description: 'Get all unpaid/sent payments that are overdue or due within 3 days, and not reminded in the past 5 days.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'draftReminderEmail',
    description: 'Draft a payment reminder email for a specific payment. Returns an agent_action record (pending) with the draft for human review.',
    input_schema: {
      type: 'object',
      properties: {
        payment_id:   { type: 'string' },
        client_name:  { type: 'string' },
        client_email: { type: 'string' },
        amount:       { type: 'number' },
        due_date:     { type: 'string' },
        subject:      { type: 'string' },
        body:         { type: 'string' },
      },
      required: ['payment_id', 'client_name', 'client_email', 'amount', 'subject', 'body'],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'getPaymentsNeedingReminder') {
    const today = new Date();
    const soonDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cooloffDate = new Date(today.getTime() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('payments')
      .select('*, clients(name, email, company)')
      .in('status', ['unpaid', 'sent'])
      .lte('due_date', soonDate)
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${cooloffDate}`)
      .order('due_date', { ascending: true });

    return data ?? [];
  }

  if (name === 'draftReminderEmail') {
    // Check: don't create a duplicate pending reminder for this payment
    const { data: existing } = await supabase
      .from('agent_actions')
      .select('id')
      .eq('type', 'draft_reminder')
      .eq('status', 'pending')
      .contains('payload', { payment_id: input.payment_id });

    if (existing && existing.length > 0) {
      return { skipped: true, reason: 'Pending reminder already exists for this payment' };
    }

    const { data, error } = await supabase
      .from('agent_actions')
      .insert({
        type: 'draft_reminder',
        payload: {
          payment_id:   input.payment_id,
          client_email: input.client_email,
          subject:      input.subject,
          body:         input.body,
        },
        display_text: `Send reminder to ${input.client_name} — $${Number(input.amount).toFixed(2)} due ${input.due_date ?? 'soon'}`,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function runPaymentReminderAgent() {
  const system = `You are a payment reminder assistant for a service business.
Your job: find payments that need reminders and draft professional, warm reminder emails.
Rules:
- Tone: friendly but clear. Never aggressive.
- Include the amount owed and due date.
- One reminder draft per payment — check for existing pending reminders and skip if found.
- NEVER claim the email has been sent. You are drafting for human review.`;

  const userMessage = `Check for payments that need reminders today and draft reminder emails for each one.
1. Call getPaymentsNeedingReminder to get the list.
2. For each payment, draft a reminder email and call draftReminderEmail to create a pending action.
3. If no payments need reminders, just say so.`;

  return runAgentLoop(system, userMessage, TOOLS, executeTool);
}
