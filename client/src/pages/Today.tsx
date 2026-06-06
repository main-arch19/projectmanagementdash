import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle, Mail, DollarSign, Sparkles } from 'lucide-react';
import { getTodayData, type PaymentWithClient, type TaskWithProject } from '../api/today';
import { markPaid, sendReminder } from '../api/payments';
import { completeTask } from '../api/tasks';
import { listAgentActions } from '../api/agentActions';
import Modal from '../components/Modal';
import AgentActionCard from '../components/AgentActionCard';
import NLInputBar from '../components/NLInputBar';
import { useToast } from '../components/Toast';
import type { AgentAction } from '@delroy/types';

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Reminder compose modal ──────────────────────────────────────────────────
function ReminderModal({
  payment,
  onClose,
}: {
  payment: PaymentWithClient;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const clientName = payment.clients?.name ?? 'Client';
  const [subject, setSubject] = useState(
    `Invoice reminder — ${fmt(payment.amount)} due ${fmtDate(payment.due_date)}`,
  );
  const [body, setBody] = useState(
    `Hi ${clientName},\n\nThis is a friendly reminder that invoice of ${fmt(payment.amount)} was due on ${fmtDate(payment.due_date)}.\n\nPlease let us know if you have any questions.\n\nThank you!`,
  );

  const send = useMutation({
    mutationFn: () => sendReminder(payment.id, subject, body),
    onSuccess: () => {
      toast('success', 'Reminder sent');
      qc.invalidateQueries({ queryKey: ['today'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <Modal title={`Send reminder — ${clientName}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
          <input
            readOnly
            value={payment.clients?.email ?? '(no email on file)'}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
          <textarea
            rows={7}
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => send.mutate()}
            disabled={send.isPending || !payment.clients?.email}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Mail size={14} />
            {send.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Payment attention card ──────────────────────────────────────────────────
function PaymentAttentionCard({
  payment,
  isOverdue,
}: {
  payment: PaymentWithClient;
  isOverdue: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showReminder, setShowReminder] = useState(false);

  const paid = useMutation({
    mutationFn: () => markPaid(payment.id),
    onSuccess: () => {
      toast('success', 'Marked as paid');
      qc.invalidateQueries({ queryKey: ['today'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <>
      <div className={`rounded-lg border p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/clients/${payment.client_id}`}
              className="text-sm font-semibold text-gray-900 hover:underline truncate block"
            >
              {payment.clients?.name ?? '—'}
            </Link>
            <p className="text-xs text-gray-500">{payment.description ?? 'Payment'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-lg font-bold ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
              {fmt(payment.amount)}
            </p>
            <p className="text-xs text-gray-500">
              Due {fmtDate(payment.due_date)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => paid.mutate()}
            disabled={paid.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={12} /> Mark paid
          </button>
          <button
            onClick={() => setShowReminder(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Mail size={12} /> Send reminder
          </button>
        </div>
      </div>
      {showReminder && (
        <ReminderModal payment={payment} onClose={() => setShowReminder(false)} />
      )}
    </>
  );
}

// ── Task row ────────────────────────────────────────────────────────────────
function TaskRow({ task }: { task: TaskWithProject }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const complete = useMutation({
    mutationFn: () => completeTask(task.id),
    onSuccess: () => {
      toast('success', 'Task done');
      qc.invalidateQueries({ queryKey: ['today'] });
    },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <button
        onClick={() => complete.mutate()}
        disabled={complete.isPending}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-gray-300 hover:border-blue-500 disabled:opacity-50"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        {task.reason && (
          <p className="mt-0.5 text-xs text-gray-500 italic">{task.reason}</p>
        )}
        <p className="mt-0.5 text-xs text-gray-400">
          {(task.projects as { clients: { name: string } | null } | null)?.clients?.name ?? ''}
          {task.due_date ? ` · due ${fmtDate(task.due_date)}` : ''}
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function TodayPage() {
  const { data, isLoading } = useQuery({ queryKey: ['today'], queryFn: getTodayData });

  const { data: agentActions } = useQuery({
    queryKey: ['agent-actions', 'pending'],
    queryFn: () => listAgentActions('pending'),
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  }

  const today = data!;
  const pendingActions = agentActions ?? ([] as AgentAction[]);
  const hasMoneyAlert = today.overdue_payments.length > 0 || today.soon_due_payments.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 pb-24 md:pb-8">
      {/* ── Money needs attention ─────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle size={18} className={hasMoneyAlert ? 'text-red-500' : 'text-gray-400'} />
          <h2 className="text-base font-semibold text-gray-900">Money needs attention</h2>
        </div>

        {!hasMoneyAlert && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            All payments are up to date.
          </p>
        )}

        {today.overdue_payments.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">Overdue</p>
            {today.overdue_payments.map(p => (
              <PaymentAttentionCard key={p.id} payment={p} isOverdue />
            ))}
          </div>
        )}

        {today.soon_due_payments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Due within 7 days</p>
            {today.soon_due_payments.map(p => (
              <PaymentAttentionCard key={p.id} payment={p} isOverdue={false} />
            ))}
          </div>
        )}
      </section>

      {/* ── Agent action cards (Phase 3) ──────────────────────────── */}
      {pendingActions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-500" />
            <h2 className="text-base font-semibold text-gray-900">AI suggestions</h2>
          </div>
          <div className="space-y-2">
            {pendingActions.map(a => (
              <AgentActionCard key={a.id} action={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Today's plan ─────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Today's plan</h2>
        </div>
        {today.open_tasks.length === 0 ? (
          <p className="text-sm text-gray-400">No open tasks.</p>
        ) : (
          <div className="space-y-2">
            {today.open_tasks.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </section>

      {/* ── Pipeline snapshot ────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <DollarSign size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Pipeline snapshot</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { key: 'intake',           label: 'Intake',           color: 'text-gray-700 bg-gray-50 border-gray-200'  },
            { key: 'in_progress',      label: 'In Progress',      color: 'text-blue-700 bg-blue-50 border-blue-200'  },
            { key: 'awaiting_payment', label: 'Awaiting Payment', color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { key: 'done',             label: 'Done',             color: 'text-green-700 bg-green-50 border-green-200' },
          ] as const).map(({ key, label, color }) => (
            <Link
              key={key}
              to="/pipeline"
              className={`rounded-lg border p-4 text-center transition-opacity hover:opacity-80 ${color}`}
            >
              <p className="text-2xl font-bold">{today.pipeline_counts[key]}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ask anything / NL update ─────────────────────────────── */}
      <section>
        <NLInputBar />
      </section>
    </div>
  );
}
