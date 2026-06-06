import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { CreateProjectDto, UpdateProjectDto, ProjectStage } from '@delroy/types';

const router = Router();

// GET /projects  ?client_id=  &stage=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase.from('projects').select('*').order('due_date', { ascending: true, nullsFirst: false });
    if (req.query.client_id) query = query.eq('client_id', req.query.client_id as string);
    if (req.query.stage)     query = query.eq('stage', req.query.stage as ProjectStage);
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 404, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /projects
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateProjectDto;
    if (!body.client_id || !body.title) {
      throw Object.assign(new Error('client_id and title are required'), { status: 422 });
    }
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...body, stage: body.stage ?? 'intake' })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpdateProjectDto;
    const { data, error } = await supabase
      .from('projects')
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

// DELETE /projects/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
