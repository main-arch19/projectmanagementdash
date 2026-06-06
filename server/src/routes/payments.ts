import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { resend, EMAIL_FROM } from '../lib/resend';
import type { CreatePaymentDto, UpdatePaymentDto, PaymentStatus } from '@delroy/types';

const router = Router();

// GET /payments  ?client_id=  &project_id=  &status=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase.from('payments').select('*').order('due_date', { ascending: true, nullsFirst: false });
    if (req.query.client_id)  query = query.eq('client_id',  req.query.client_id  as string);
    if (req.query.project_id) query = query.eq('project_id', req.query.project_id as string);
    if (req.query.status)     query = query.eq('status',     req.query.status     as PaymentStatus);
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /payments/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 404, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /payments
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreatePaymentDto;
    if (!body.project_id || !body.client_id || body.amount == null) {
      throw Object.assign(new Error('project_id, client_id, and amount are required'), { status: 422 });
    }
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...body, status: body.status ?? 'unpaid' })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /payments/:id  — general update
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpdatePaymentDto;
    const { data, error } = await supabase
      .from('payments')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /payments/:id/mark-paid  — one-click paid action
router.post('/:id/mark-paid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /payments/:id/send-reminder  — human composes, server sends + stamps reminder_sent_at
router.post('/:id/send-reminder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, body } = req.body as { subject: string; body: string };
    if (!subject || !body) {
      throw Object.assign(new Error('subject and body are required'), { status: 422 });
    }

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*, clients(name, email)')
      .eq('id', req.params.id)
      .single();
    if (pErr || !payment) throw Object.assign(new Error(pErr?.message ?? 'Not found'), { status: 404 });

    const clientEmail = (payment.clients as { email?: string } | null)?.email;
    if (!clientEmail) throw Object.assign(new Error('Client has no email on file'), { status: 422 });

    if (!resend) throw Object.assign(new Error('RESEND_API_KEY not configured'), { status: 503 });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: clientEmail,
      subject,
      text: body,
    });

    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'sent', reminder_sent_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /payments/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id);
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
