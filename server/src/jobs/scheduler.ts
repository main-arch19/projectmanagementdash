import cron from 'node-cron';
import { runPaymentReminderAgent } from '../agents/agentB';
import { runDailyPlannerAgent }    from '../agents/agentC';

export function startScheduler() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[scheduler] ANTHROPIC_API_KEY not set — agents disabled');
    return;
  }

  // Daily planner — 7:00 AM every day
  cron.schedule('0 7 * * *', async () => {
    console.log('[agentC] Running daily planner…');
    try {
      const result = await runDailyPlannerAgent();
      console.log(`[agentC] Done. ${result.toolCallCount} tool calls.`);
    } catch (err) {
      console.error('[agentC] Error:', err);
    }
  });

  // Payment reminder drafter — 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('[agentB] Running payment reminder agent…');
    try {
      const result = await runPaymentReminderAgent();
      console.log(`[agentB] Done. ${result.toolCallCount} tool calls.`);
    } catch (err) {
      console.error('[agentB] Error:', err);
    }
  });

  console.log('[scheduler] Started — daily planner 7:00 AM, reminders 9:00 AM');
}
