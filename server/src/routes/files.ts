import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import type { CreateFileDto, UpdateFileDto } from '@delroy/types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// GET /files  ?client_id=  &project_id=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = supabase.from('files').select('*').order('uploaded_at', { ascending: false });
    if (req.query.client_id)  query = query.eq('client_id',  req.query.client_id  as string);
    if (req.query.project_id) query = query.eq('project_id', req.query.project_id as string);
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /files/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 404, details: error });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /files/upload — multipart: binary → Supabase Storage, then register metadata
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw Object.assign(new Error('file is required'), { status: 422 });
    const { client_id, project_id, category } = req.body as {
      client_id: string; project_id?: string; category?: string;
    };
    if (!client_id) throw Object.assign(new Error('client_id is required'), { status: 422 });

    const ext = req.file.originalname.split('.').pop() ?? 'bin';
    const storagePath = `clients/${client_id}/${uuid()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw Object.assign(new Error(uploadError.message), { status: 400, details: uploadError });

    const { data, error } = await supabase
      .from('files')
      .insert({
        client_id,
        project_id: project_id || null,
        storage_path: storagePath,
        original_filename: req.file.originalname,
        category: category ?? 'other',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /files  — register file metadata only (binary already in storage)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateFileDto;
    if (!body.client_id || !body.storage_path || !body.original_filename) {
      throw Object.assign(
        new Error('client_id, storage_path, and original_filename are required'),
        { status: 422 },
      );
    }
    const { data, error } = await supabase
      .from('files')
      .insert({ ...body, category: body.category ?? 'other', uploaded_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /files/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as UpdateFileDto;
    const { data, error } = await supabase
      .from('files')
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

// DELETE /files/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', req.params.id);
    if (error) throw Object.assign(new Error(error.message), { status: 400, details: error });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
