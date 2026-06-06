import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Building, Plus, CheckCircle, Upload, Pencil } from 'lucide-react';
import { getClient, updateClient } from '../api/clients';
import { listProjects, createProject } from '../api/projects';
import { listPayments, createPayment, markPaid, sendReminder } from '../api/payments';
import { listFiles, uploadFile } from '../api/files';
import { listTasks, createTask, completeTask } from '../api/tasks';
import { PaymentBadge, StageBadge, ClientStatusBadge } from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type {
  CreateProjectDto, CreatePaymentDto, CreateTaskDto, ProjectStage, FileCategory,
} from '@delroy/types';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ── Modals ───────────────────────────────────────────────────────────────────
function AddProjectModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<CreateProjectDto>>({ client_id: clientId, stage: 'intake' });
  const add = useMutation({
    mutationFn: () => createProject({ client_id: clientId, title: form.title!, stage: form.stage, value: form.value, due_date: form.due_date }),
    onSuccess: () => { toast('success', 'Project added'); qc.invalidateQueries({ queryKey: ['projects', clientId] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title="Add project" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
            <select value={form.stage ?? 'intake'} onChange={e => setForm(f => ({ ...f, stage: e.target.value as ProjectStage }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              {(['intake','in_progress','awaiting_payment','done'] as ProjectStage[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Value ($)</label>
            <input type="number" value={form.value ?? ''} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
          <input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => add.mutate()} disabled={!form.title || add.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{add.isPending ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddPaymentModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [] } = useQuery({ queryKey: ['projects', clientId], queryFn: () => listProjects({ client_id: clientId }) });
  const [form, setForm] = useState<Partial<CreatePaymentDto>>({ client_id: clientId });
  const add = useMutation({
    mutationFn: () => createPayment({ client_id: clientId, project_id: form.project_id!, amount: form.amount!, description: form.description, due_date: form.due_date }),
    onSuccess: () => { toast('success', 'Payment added'); qc.invalidateQueries({ queryKey: ['payments', clientId] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title="Add payment" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
          <select value={form.project_id ?? ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Select project…</option>
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
          <button onClick={() => add.mutate()} disabled={!form.project_id || !form.amount || add.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{add.isPending ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddTaskModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [] } = useQuery({ queryKey: ['projects', clientId], queryFn: () => listProjects({ client_id: clientId }) });
  const [form, setForm] = useState<Partial<CreateTaskDto>>({});
  const add = useMutation({
    mutationFn: () => createTask({ project_id: form.project_id!, title: form.title!, reason: form.reason, due_date: form.due_date }),
    onSuccess: () => { toast('success', 'Task added'); qc.invalidateQueries({ queryKey: ['tasks', clientId] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title="Add task" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
          <select value={form.project_id ?? ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Why (reason)</label>
          <input value={form.reason ?? ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
          <input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => add.mutate()} disabled={!form.project_id || !form.title || add.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{add.isPending ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

function UploadFileModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [] } = useQuery({ queryKey: ['projects', clientId], queryFn: () => listProjects({ client_id: clientId }) });
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<FileCategory>('other');
  const upload = useMutation({
    mutationFn: () => uploadFile({ file: file!, client_id: clientId, project_id: projectId || undefined, category }),
    onSuccess: () => { toast('success', 'File uploaded'); qc.invalidateQueries({ queryKey: ['files', clientId] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });
  return (
    <Modal title="Upload file" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project (optional)</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as FileCategory)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              {(['contract','invoice','receipt','deliverable','other'] as FileCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => upload.mutate()} disabled={!file || upload.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{upload.isPending ? 'Uploading…' : 'Upload'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Reminder compose (inline in detail) ─────────────────────────────────────
function ReminderModal({ paymentId, clientEmail, clientName, onClose }: {
  paymentId: string; clientEmail: string | null; clientName: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const clientId = useParams().id!;
  const [subject, setSubject] = useState(`Invoice reminder`);
  const [body, setBody] = useState(`Hi ${clientName},\n\nThis is a friendly reminder about your outstanding invoice.\n\nThank you!`);
  const send = useMutation({
    mutationFn: () => sendReminder(paymentId, subject, body),
    onSuccess: () => { toast('success', 'Reminder sent'); qc.invalidateQueries({ queryKey: ['payments', clientId] }); onClose(); },
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

// ── Main page ────────────────────────────────────────────────────────────────
type Tab = 'payments' | 'projects' | 'files' | 'tasks';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('payments');
  const [modal, setModal] = useState<null | 'project' | 'payment' | 'task' | 'file'>(null);
  const [reminderPaymentId, setReminderPaymentId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id!),
    enabled: !!id,
  });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', id], queryFn: () => listProjects({ client_id: id! }), enabled: !!id });
  const { data: payments = [] } = useQuery({ queryKey: ['payments', id], queryFn: () => listPayments({ client_id: id! }), enabled: !!id });
  const { data: files   = [] } = useQuery({ queryKey: ['files',    id], queryFn: () => listFiles({ client_id: id! }),    enabled: !!id });
  const { data: tasks   = [] } = useQuery({ queryKey: ['tasks',    id], queryFn: () => {
    const projectIds = projects.map(p => p.id);
    return projectIds.length ? listTasks() : Promise.resolve([]);
  }, enabled: !!id && projects.length > 0 });

  const updateClient2 = useMutation({
    mutationFn: () => updateClient(id!, editForm),
    onSuccess: () => { toast('success', 'Saved'); qc.invalidateQueries({ queryKey: ['client', id] }); setEditing(false); },
    onError: (e: Error) => toast('error', e.message),
  });

  const paid = useMutation({
    mutationFn: (pid: string) => markPaid(pid),
    onSuccess: () => { toast('success', 'Marked paid'); qc.invalidateQueries({ queryKey: ['payments', id] }); },
    onError: (e: Error) => toast('error', e.message),
  });

  const doneTask = useMutation({
    mutationFn: (tid: string) => completeTask(tid),
    onSuccess: () => { toast('success', 'Done'); qc.invalidateQueries({ queryKey: ['tasks', id] }); },
    onError: (e: Error) => toast('error', e.message),
  });

  const clientTasks = tasks.filter(t => projects.some(p => p.id === t.project_id));
  const reminderPayment = reminderPaymentId ? payments.find(p => p.id === reminderPaymentId) : null;

  if (isLoading) return <div className="flex h-full items-center justify-center text-gray-400">Loading…</div>;
  if (!client) return <div className="p-8 text-gray-500">Client not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
      {/* Back */}
      <Link to="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Clients
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {editing ? (
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="rounded border border-gray-300 px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500" />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
              )}
              <ClientStatusBadge status={client.status} />
            </div>
          </div>
          <button
            onClick={() => {
              if (!editing) {
                setEditForm({ name: client.name, email: client.email ?? '', phone: client.phone ?? '', company: client.company ?? '', notes: client.notes ?? '' });
              }
              setEditing(!editing);
            }}
            className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
          >
            <Pencil size={15} />
          </button>
        </div>

        {editing ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(['email','phone','company'] as const).map(k => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1 capitalize">{k}</label>
                <input value={editForm[k]} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={() => updateClient2.mutate()} disabled={updateClient2.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            {client.email   && <span className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" />{client.email}</span>}
            {client.phone   && <span className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" />{client.phone}</span>}
            {client.company && <span className="flex items-center gap-1.5"><Building size={13} className="text-gray-400" />{client.company}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(['payments','projects','files','tasks'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t}
            <span className="ml-1.5 text-xs text-gray-400">
              {t === 'payments' ? payments.length : t === 'projects' ? projects.length : t === 'files' ? files.length : clientTasks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Payments tab */}
      {tab === 'payments' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={() => setModal('payment')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={14} /> Add payment</button>
          </div>
          {payments.length === 0 ? <p className="text-sm text-gray-400">No payments yet.</p> : payments.map(p => (
            <div key={p.id} className={`rounded-lg border p-3 ${p.status === 'overdue' || (p.due_date && new Date(p.due_date) < new Date() && p.status !== 'paid') ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{fmt(p.amount)}</p>
                  <p className="text-xs text-gray-500">{p.description ?? '—'} · due {fmtDate(p.due_date)}</p>
                </div>
                <PaymentBadge status={p.status} />
              </div>
              {p.status !== 'paid' && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => paid.mutate(p.id)} disabled={paid.isPending} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"><CheckCircle size={11} /> Mark paid</button>
                  <button onClick={() => setReminderPaymentId(p.id)} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"><Mail size={11} /> Reminder</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects tab */}
      {tab === 'projects' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={() => setModal('project')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={14} /> Add project</button>
          </div>
          {projects.length === 0 ? <p className="text-sm text-gray-400">No projects yet.</p> : projects.map(p => (
            <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <StageBadge stage={p.stage} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {p.value != null ? fmt(p.value) : '—'} · due {fmtDate(p.due_date)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Files tab */}
      {tab === 'files' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={() => setModal('file')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Upload size={14} /> Upload file</button>
          </div>
          {files.length === 0 ? <p className="text-sm text-gray-400">No files yet.</p> : files.map(f => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600 shrink-0">
                {f.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{f.original_filename}</p>
                <p className="text-xs text-gray-400">{f.category} · {fmtDate(f.uploaded_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={() => setModal('task')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={14} /> Add task</button>
          </div>
          {clientTasks.length === 0 ? <p className="text-sm text-gray-400">No tasks yet.</p> : clientTasks.map(t => (
            <div key={t.id} className={`flex items-start gap-3 rounded-lg border p-3 ${t.done ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'}`}>
              <button onClick={() => !t.done && doneTask.mutate(t.id)} disabled={t.done || doneTask.isPending} className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 ${t.done ? 'border-green-400 bg-green-400' : 'border-gray-300 hover:border-blue-500'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                {t.reason && <p className="text-xs text-gray-500 italic">{t.reason}</p>}
                {t.due_date && <p className="text-xs text-gray-400">due {fmtDate(t.due_date)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'project' && <AddProjectModal clientId={id!} onClose={() => setModal(null)} />}
      {modal === 'payment' && <AddPaymentModal clientId={id!} onClose={() => setModal(null)} />}
      {modal === 'task'    && <AddTaskModal    clientId={id!} onClose={() => setModal(null)} />}
      {modal === 'file'    && <UploadFileModal clientId={id!} onClose={() => setModal(null)} />}
      {reminderPayment && (
        <ReminderModal
          paymentId={reminderPayment.id}
          clientEmail={client.email ?? null}
          clientName={client.name}
          onClose={() => setReminderPaymentId(null)}
        />
      )}
    </div>
  );
}
