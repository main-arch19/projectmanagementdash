import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, Plus } from 'lucide-react';
import { listPayments, markPaid, sendReminder, createPayment } from '../api/payments';
import { listClients } from '../api/clients';
import { listProjects } from '../api/projects';
import { PaymentBadge } from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { PaymentStatus, CreatePaymentDto } from '@delroy/types';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const FILTER_TABS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all',     label: 'All'         },
  { key: 'unpaid',  label: 'Unpaid'      },
  { key: 'overdue', label: 'Overdue'     },
  { key: 'sent',    label: 'Sent'        },
  { key: 'paid',    label: 'Paid'        },
];

function ReminderModal({ paymentId, clientEmail, clientName, onClose }: {
  paymentId: string; clientEmail: string | null; clientName: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [subject, setSubject] = useState('Invoice reminder');
  const [body, setBody] = useState(`Hi ${clientName},\n\nThis is a reminder about your outstanding invoice. Please let us know if you have any questions.\n\nThank you!`);
  const send = useMutation({
    mutationFn: () => sendReminder(paymentId, subject, body),
    onSuccess: () => { toast('success', 'Reminder sent'); qc.invalidateQueries({ queryKey: ['payments-all'] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title={`Send reminder — ${clientName}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Subject" />
        <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => send.mutate()} disabled={!clientEmail || send.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{send.isPending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddPaymentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => listClients('active') });
  const [clientId, setClientId] = useState('');
  const { data: projects = [] } = useQuery({ queryKey: ['projects', clientId], queryFn: () => listProjects({ client_id: clientId }), enabled: !!clientId });
  const [form, setForm] = useState<Partial<CreatePaymentDto>>({});
  const add = useMutation({
    mutationFn: () => createPayment({ client_id: clientId, project_id: form.project_id!, amount: form.amount!, description: form.description, due_date: form.due_date }),
    onSuccess: () => { toast('success', 'Payment added'); qc.invalidateQueries({ queryKey: ['payments-all'] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title="Add payment" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Select…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
          <select value={form.project_id ?? ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} disabled={!clientId} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Select…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount ($)</label>
            <input type="number" value={form.amount ?? ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
            <input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => add.mutate()} disabled={!clientId || !form.project_id || !form.amount || add.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{add.isPending ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [reminderPaymentId, setReminderPaymentId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments-all'],
    queryFn: () => listPayments(),
  });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => listClients() });
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const today = new Date();
  const enriched = payments.map(p => ({
    ...p,
    isOverdue: p.status !== 'paid' && !!p.due_date && new Date(p.due_date) < today,
  }));

  const filtered = filter === 'all'
    ? enriched
    : filter === 'overdue'
      ? enriched.filter(p => p.isOverdue)
      : enriched.filter(p => p.status === filter);

  // Summary stats
  const outstanding = enriched.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const overdue     = enriched.filter(p => p.isOverdue).reduce((s, p) => s + p.amount, 0);
  const paidThisMonth = enriched.filter(p => {
    if (!p.paid_at) return false;
    const d = new Date(p.paid_at);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).reduce((s, p) => s + p.amount, 0);

  const paid = useMutation({
    mutationFn: (id: string) => markPaid(id),
    onSuccess: () => { toast('success', 'Marked paid'); qc.invalidateQueries({ queryKey: ['payments-all'] }); },
    onError: (e: Error) => toast('error', e.message),
  });

  const reminderPayment = reminderPaymentId ? payments.find(p => p.id === reminderPaymentId) : null;
  const reminderClient = reminderPayment ? clientMap[reminderPayment.client_id] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={15} /> Add</button>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-xl font-bold text-gray-900">{fmt(outstanding)}</p>
          <p className="text-xs text-gray-500 mt-1">Outstanding</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${overdue > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <p className={`text-xl font-bold ${overdue > 0 ? 'text-red-700' : 'text-gray-900'}`}>{fmt(overdue)}</p>
          <p className="text-xs text-gray-500 mt-1">Overdue</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-xl font-bold text-green-700">{fmt(paidThisMonth)}</p>
          <p className="text-xs text-gray-500 mt-1">Paid this month</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 whitespace-nowrap rounded-md py-1.5 text-sm font-medium transition-colors ${filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No payments in this view.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const client = clientMap[p.client_id];
            return (
              <div key={p.id} className={`rounded-lg border p-4 ${p.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/clients/${p.client_id}`} className="text-sm font-semibold text-gray-900 hover:underline">
                      {client?.name ?? '—'}
                    </Link>
                    <p className="text-xs text-gray-500">{p.description ?? '—'} · due {fmtDate(p.due_date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-base font-bold ${p.isOverdue ? 'text-red-700' : 'text-gray-900'}`}>{fmt(p.amount)}</span>
                    <PaymentBadge status={p.status} />
                  </div>
                </div>
                {p.status !== 'paid' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => paid.mutate(p.id)} disabled={paid.isPending} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"><CheckCircle size={12} /> Mark paid</button>
                    <button onClick={() => setReminderPaymentId(p.id)} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"><Mail size={12} /> Send reminder</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddPaymentModal onClose={() => setShowAdd(false)} />}
      {reminderPayment && reminderClient && (
        <ReminderModal
          paymentId={reminderPayment.id}
          clientEmail={reminderClient.email ?? null}
          clientName={reminderClient.name}
          onClose={() => setReminderPaymentId(null)}
        />
      )}
    </div>
  );
}
