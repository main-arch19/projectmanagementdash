import { Router, Request, Response } from 'express';
import {
  demoClients, demoProjects, demoPayments, demoFiles,
  demoTasks, demoAgentActions, demoTodayData,
} from '../lib/demoData';

const router = Router();

const DEMO_WRITE = { data: null, message: 'Demo mode — writes are disabled' };

// Today
router.get('/today', (_req: Request, res: Response) => {
  res.json({ data: demoTodayData });
});

// Clients
router.get('/clients', (req: Request, res: Response) => {
  const { status } = req.query;
  const result = status ? demoClients.filter(c => c.status === status) : demoClients;
  res.json({ data: result });
});
router.get('/clients/:id', (req: Request, res: Response) => {
  const client = demoClients.find(c => c.id === req.params.id);
  if (!client) return void res.status(404).json({ error: 'Not found' });
  res.json({ data: client });
});

// Projects
router.get('/projects', (req: Request, res: Response) => {
  let result = demoProjects;
  if (req.query.client_id) result = result.filter(p => p.client_id === req.query.client_id);
  if (req.query.stage)     result = result.filter(p => p.stage === req.query.stage);
  res.json({ data: result });
});
router.get('/projects/:id', (req: Request, res: Response) => {
  const project = demoProjects.find(p => p.id === req.params.id);
  if (!project) return void res.status(404).json({ error: 'Not found' });
  res.json({ data: project });
});

// Payments
router.get('/payments', (req: Request, res: Response) => {
  let result = demoPayments;
  if (req.query.client_id)  result = result.filter(p => p.client_id === req.query.client_id);
  if (req.query.project_id) result = result.filter(p => p.project_id === req.query.project_id);
  if (req.query.status)     result = result.filter(p => p.status === req.query.status);
  res.json({ data: result });
});
router.get('/payments/:id', (req: Request, res: Response) => {
  const payment = demoPayments.find(p => p.id === req.params.id);
  if (!payment) return void res.status(404).json({ error: 'Not found' });
  res.json({ data: payment });
});

// Tasks
router.get('/tasks', (req: Request, res: Response) => {
  let result = demoTasks;
  if (req.query.project_id) result = result.filter(t => t.project_id === req.query.project_id);
  if (req.query.done !== undefined) {
    const wantDone = req.query.done === 'true';
    result = result.filter(t => t.done === wantDone);
  }
  res.json({ data: result });
});
router.get('/tasks/:id', (req: Request, res: Response) => {
  const task = demoTasks.find(t => t.id === req.params.id);
  if (!task) return void res.status(404).json({ error: 'Not found' });
  res.json({ data: task });
});

// Files
router.get('/files', (req: Request, res: Response) => {
  let result = demoFiles;
  if (req.query.client_id)  result = result.filter(f => f.client_id === req.query.client_id);
  if (req.query.project_id) result = result.filter(f => f.project_id === req.query.project_id);
  res.json({ data: result });
});
router.get('/files/:id', (req: Request, res: Response) => {
  const file = demoFiles.find(f => f.id === req.params.id);
  if (!file) return void res.status(404).json({ error: 'Not found' });
  res.json({ data: file });
});

// Agent Actions
router.get('/agent-actions', (req: Request, res: Response) => {
  const { status } = req.query;
  const result = status ? demoAgentActions.filter(a => a.status === status) : demoAgentActions;
  res.json({ data: result });
});

// All mutating routes — disabled in demo mode
router.post('*',   (_req, res) => res.json(DEMO_WRITE));
router.patch('*',  (_req, res) => res.json(DEMO_WRITE));
router.delete('*', (_req, res) => res.json(DEMO_WRITE));

export default router;
