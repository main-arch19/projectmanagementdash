/**
 * Agent action routes — human confirmation layer.
 * GET    /agent-actions            list (filter by status)
 * POST   /agent-actions/:id/approve  execute + mark approved
 * POST   /agent-actions/:id/dismiss  mark dismissed
 * POST   /agent-actions/nl-update    run Agent D
 * POST   /agent-actions/nl-query     run Agent E
 * POST   /agent-actions/run-file-intake  run Agent A on a file
 * POST   /agent-actions/run-reminders    run Agent B manually
 * POST   /agent-actions/run-planner      run Agent C manually
 */
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { resend, EMAIL_FROM } from '../lib/resend';
import { runFileIntakeAgent }       from '../agents/agentA';
import { runPaymentReminderAgent }  from '../agents/agentB';
import { runDailyPlannerAgent }     from '../agents/agentC';
import { runNlUpdateAgent }         from '../agents/agentD';
import { runNlQueryAgent }          from '../agents/agentE';
import type { AgentActionType } from '@delroy/types';

const router = Router();

// ── List ─────────────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase
      .from('agent_actions')
      .select('*')
      .order('created_at', { ascending: false });
    if (req.query.status) query = query.eq('status', req.query.status as string);
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    res.json({ data });
  } catch (err) { next(err); }
});

// ── Approve ──────────────────────────────────────────────────────────────────
router.post('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: action, error: fetchErr } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (fetchErr || !action) throw Object.assign(new Error('Not found'), { status: 404 });
    if (action.status !== 'pending') throw Object.assign(new Error('Action is not pending'), { status: 409 });

    const overrides = req.body?.overrides ?? {};
    const payload = { ...action.payload, ...overrides } as Record<string, unknown>;
    const type = action.type as AgentActionType;

    // Execute the action
    if (type === 'draft_reminder') {
      if (!resend) throw Object.assign(new Error('RESEND_API_KEY not configured'), { status: 503 });
      const subject = String(overrides.subject ?? payload.subject ?? 'Invoice reminder');
      const body    = String(overrides.body    ?? payload.body    ?? '');
      await resend.emails.send({
        from: EMAIL_FROM,
        to:   String(payload.client_email),
        subject,
        text: body,
      });
      await supabase
        .from('payments')
        .update({ status: 'sent', reminder_sent_at: new Date().toISOString() })
        .eq('id', payload.payment_id);
    }

    if (type === 'file_document') {
      const updates: Record<string, unknown> = { category: payload.category };
      if (payload.client_id)        updates.client_id        = payload.client_id;
      if (payload.project_id)       updates.project_id       = payload.project_id;
      if (payload.extracted_fields) updates.extracted_fields  = payload.extracted_fields;
      await supabase.from('files').update(updates).eq('id', payload.file_id);
    }

    if (type === 'update_stage') {
      await supabase
        .from('projects')
        .update({ stage: payload.new_stage })
        .eq('id', payload.project_id);
    }

    if (type === 'mark_paid') {
      await supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payload.payment_id);
    }

    if (type === 'create_task') {
      await supabase.from('tasks').insert({
        project_id: payload.project_id,
        title:      payload.title,
        reason:     payload.reason ?? null,
        done: false,
      });
    }

    // Mark approved
    const { data, error } = await supabase
      .from('agent_actions')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    res.json({ data });
  } catch (err) { next(err); }
});

// ── Dismiss ──────────────────────────────────────────────────────────────────
router.post('/:id/dismiss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('agent_actions')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    res.json({ data });
  } catch (err) { next(err); }
});

// ── Agent D: NL update ────────────────────────────────────────────────────────
router.post('/nl-update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) throw Object.assign(new Error('text is required'), { status: 422 });
    await runNlUpdateAgent(text);
    // Return the newly created pending actions
    const { data } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    res.json({ data: data ?? [] });
  } catch (err) { next(err); }
});

// ── Agent E: NL query ─────────────────────────────────────────────────────────
router.post('/nl-query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body as { query: string };
    if (!query) throw Object.assign(new Error('query is required'), { status: 422 });
    const answer = await runNlQueryAgent(query);
    res.json({ data: { answer } });
  } catch (err) { next(err); }
});

// ── Manual agent triggers (for testing / on-demand) ───────────────────────────
router.post('/run-file-intake', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { file_id } = req.body as { file_id: string };
    if (!file_id) throw Object.assign(new Error('file_id is required'), { status: 422 });
    const result = await runFileIntakeAgent(file_id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/run-reminders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runPaymentReminderAgent();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/run-planner', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runDailyPlannerAgent();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
