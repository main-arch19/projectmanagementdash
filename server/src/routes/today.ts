import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /today — aggregated data for the Today screen
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const soonDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [overdueResult, soonResult, tasksResult, stageResult] = await Promise.all([
      // overdue: unpaid/sent with due_date < today
      supabase
        .from('payments')
        .select('*, clients(name, email, company)')
        .in('status', ['unpaid', 'sent'])
        .lt('due_date', today)
        .order('due_date', { ascending: true }),

      // soon due: unpaid/sent with due_date between today and today+7
      supabase
        .from('payments')
        .select('*, clients(name, email, company)')
        .in('status', ['unpaid', 'sent'])
        .gte('due_date', today)
        .lte('due_date', soonDate)
        .order('due_date', { ascending: true }),

      // open tasks, priority-sorted
      supabase
        .from('tasks')
        .select('*, projects(title, client_id, clients(name))')
        .eq('done', false)
        .order('priority', { ascending: true, nullsFirst: false })
        .order('due_date', { ascending: true, nullsFirst: false }),

      // pipeline counts per stage
      supabase
        .from('projects')
        .select('stage')
        .neq('stage', 'done'),
    ]);

    for (const r of [overdueResult, soonResult, tasksResult, stageResult]) {
      if (r.error) throw Object.assign(new Error(r.error.message), { status: 400, details: r.error });
    }

    const stageCounts = { intake: 0, in_progress: 0, awaiting_payment: 0, done: 0 };
    for (const row of stageResult.data ?? []) {
      const s = row.stage as keyof typeof stageCounts;
      if (s in stageCounts) stageCounts[s]++;
    }

    res.json({
      data: {
        overdue_payments: overdueResult.data ?? [],
        soon_due_payments: soonResult.data ?? [],
        open_tasks: tasksResult.data ?? [],
        pipeline_counts: stageCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
