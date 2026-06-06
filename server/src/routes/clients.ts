import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { CreateClientDto, UpdateClientDto, ClientStatus } from '@delroy/types';

const router = Router();

// GET /clients  ?status=active|archived
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase.from('clients').select('*').order('name');
    if (req.query.status) {
      query = query.eq('status', req.query.status as ClientStatus);
    }
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /clients/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 404, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /clients
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateClientDto;
    if (!body.name) {
      throw Object.assign(new Error('name is required'), { status: 422 });
    }
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...body, status: body.status ?? 'active' })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /clients/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpdateClientDto;
    const { data, error } = await supabase
      .from('clients')
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

// DELETE /clients/:id  — soft-delete (archive)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ status: 'archived' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
