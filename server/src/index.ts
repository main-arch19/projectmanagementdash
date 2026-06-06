import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import clientsRouter      from './routes/clients';
import projectsRouter     from './routes/projects';
import paymentsRouter     from './routes/payments';
import filesRouter        from './routes/files';
import tasksRouter        from './routes/tasks';
import todayRouter        from './routes/today';
import agentActionsRouter from './routes/agentActions';
import { errorHandler }   from './middleware/errorHandler';
import { startScheduler } from './jobs/scheduler';

const app = express();

app.use(cors());
app.use(express.json());

// TODO Phase 2: add Supabase JWT auth middleware here before routes

const API = '/api/v1';
app.use(`${API}/clients`,       clientsRouter);
app.use(`${API}/projects`,      projectsRouter);
app.use(`${API}/payments`,      paymentsRouter);
app.use(`${API}/files`,         filesRouter);
app.use(`${API}/tasks`,         tasksRouter);
app.use(`${API}/today`,         todayRouter);
app.use(`${API}/agent-actions`, agentActionsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  startScheduler();
});

export default app;
