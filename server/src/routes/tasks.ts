import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { CreateTaskDto, UpdateTaskDto } from '@delroy/types';

const router = Router();

// GET /tasks  ?project_id=  &done=false|true
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true, nullsFirst: false })
      .order('due_date',  { ascending: true, nullsFirst: false });
    if (req.query.project_id) query = query.eq('project_id', req.query.project_id as string);
    if (req.query.done !== undefined) {
      query = query.eq('done', req.query.done === 'true');
    }
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 404, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /tasks
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateTaskDto;
    if (!body.project_id || !body.title) {
      throw Object.assign(new Error('project_id and title are required'), { status: 422 });
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...body, done: body.done ?? false })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpdateTaskDto;
    const { data, error } = await supabase
      .from('tasks')
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

// POST /tasks/:id/complete  — one-click done
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ done: true })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
