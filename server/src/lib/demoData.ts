import type {
  Client, Project, Payment, ProjectFile, Task, AgentAction,
} from '@delroy/types';

// ─── Clients ──────────────────────────────────────────────────────────────────

export const demoClients: Client[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Marcus Webb',
    email: 'marcus@webbcreative.co',
    phone: '+1 876 555 0101',
    company: 'Webb Creative Co.',
    status: 'active',
    notes: 'Prefers communication via email. Retainer client since 2023.',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2025-03-10T14:22:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Nia Clarke',
    email: 'nia@claritybrand.com',
    phone: '+1 876 555 0202',
    company: 'Clarity Branding',
    status: 'active',
    notes: null,
    created_at: '2024-04-20T10:30:00Z',
    updated_at: '2025-05-01T08:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Devon Holt',
    email: 'devon@holtventures.io',
    phone: null,
    company: 'Holt Ventures',
    status: 'active',
    notes: 'New client — intro call done, scoping in progress.',
    created_at: '2025-05-01T11:00:00Z',
    updated_at: '2025-05-01T11:00:00Z',
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

export const demoProjects: Project[] = [
  {
    id: 'p2000000-0000-0000-0000-000000000001',
    client_id: 'c1000000-0000-0000-0000-000000000001',
    title: 'Brand Refresh — Webb Creative',
    stage: 'in_progress',
    value: 4500,
    start_date: '2025-04-01',
    due_date: '2025-06-30',
    created_at: '2025-04-01T09:00:00Z',
    updated_at: '2025-05-20T10:00:00Z',
  },
  {
    id: 'p2000000-0000-0000-0000-000000000002',
    client_id: 'c1000000-0000-0000-0000-000000000002',
    title: 'Website Redesign — Clarity',
    stage: 'awaiting_payment',
    value: 7200,
    start_date: '2025-02-01',
    due_date: '2025-05-15',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-05-15T16:00:00Z',
  },
  {
    id: 'p2000000-0000-0000-0000-000000000003',
    client_id: 'c1000000-0000-0000-0000-000000000003',
    title: 'Logo & Identity Package',
    stage: 'intake',
    value: 2000,
    start_date: null,
    due_date: null,
    created_at: '2025-05-01T11:00:00Z',
    updated_at: '2025-05-01T11:00:00Z',
  },
  {
    id: 'p2000000-0000-0000-0000-000000000004',
    client_id: 'c1000000-0000-0000-0000-000000000001',
    title: 'Social Media Templates Q2',
    stage: 'in_progress',
    value: 1800,
    start_date: '2025-05-01',
    due_date: '2025-06-15',
    created_at: '2025-05-01T09:00:00Z',
    updated_at: '2025-05-28T12:00:00Z',
  },
];

// ─── Payments ─────────────────────────────────────────────────────────────────

export const demoPayments: Payment[] = [
  {
    id: 'pay30000-0000-0000-0000-000000000001',
    project_id: 'p2000000-0000-0000-0000-000000000002',
    client_id: 'c1000000-0000-0000-0000-000000000002',
    amount: 3600,
    description: 'Website Redesign — 50% deposit',
    due_date: '2025-05-20',
    status: 'overdue',
    paid_at: null,
    reminder_sent_at: '2025-05-21T09:00:00Z',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-05-21T09:00:00Z',
  },
  {
    id: 'pay30000-0000-0000-0000-000000000002',
    project_id: 'p2000000-0000-0000-0000-000000000001',
    client_id: 'c1000000-0000-0000-0000-000000000001',
    amount: 2250,
    description: 'Brand Refresh — milestone 1',
    due_date: '2026-06-10',
    status: 'unpaid',
    paid_at: null,
    reminder_sent_at: null,
    created_at: '2025-04-01T09:00:00Z',
    updated_at: '2025-04-01T09:00:00Z',
  },
  {
    id: 'pay30000-0000-0000-0000-000000000003',
    project_id: 'p2000000-0000-0000-0000-000000000004',
    client_id: 'c1000000-0000-0000-0000-000000000001',
    amount: 1800,
    description: 'Social Media Templates — full payment',
    due_date: '2026-06-12',
    status: 'sent',
    paid_at: null,
    reminder_sent_at: '2025-06-01T09:00:00Z',
    created_at: '2025-05-01T09:00:00Z',
    updated_at: '2025-06-01T09:00:00Z',
  },
  {
    id: 'pay30000-0000-0000-0000-000000000004',
    project_id: 'p2000000-0000-0000-0000-000000000002',
    client_id: 'c1000000-0000-0000-0000-000000000002',
    amount: 3600,
    description: 'Website Redesign — final payment',
    due_date: '2025-06-01',
    status: 'paid',
    paid_at: '2025-05-30T10:00:00Z',
    reminder_sent_at: null,
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-05-30T10:00:00Z',
  },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const demoTasks: Task[] = [
  {
    id: 't4000000-0000-0000-0000-000000000001',
    project_id: 'p2000000-0000-0000-0000-000000000001',
    payment_id: null,
    title: 'Deliver revised logo concepts',
    reason: 'Client requested two additional directions',
    due_date: '2026-06-08',
    done: false,
    priority: 1,
    created_at: '2025-05-20T09:00:00Z',
    updated_at: '2025-05-20T09:00:00Z',
  },
  {
    id: 't4000000-0000-0000-0000-000000000002',
    project_id: 'p2000000-0000-0000-0000-000000000002',
    payment_id: 'pay30000-0000-0000-0000-000000000001',
    title: 'Follow up on overdue invoice',
    reason: 'Payment 17 days past due',
    due_date: '2026-06-07',
    done: false,
    priority: 1,
    created_at: '2025-05-21T09:00:00Z',
    updated_at: '2025-05-21T09:00:00Z',
  },
  {
    id: 't4000000-0000-0000-0000-000000000003',
    project_id: 'p2000000-0000-0000-0000-000000000003',
    payment_id: null,
    title: 'Send project scope document to Devon',
    reason: null,
    due_date: '2026-06-09',
    done: false,
    priority: 2,
    created_at: '2025-05-02T09:00:00Z',
    updated_at: '2025-05-02T09:00:00Z',
  },
  {
    id: 't4000000-0000-0000-0000-000000000004',
    project_id: 'p2000000-0000-0000-0000-000000000004',
    payment_id: null,
    title: 'Export final template set as Figma + PDF',
    reason: null,
    due_date: '2026-06-14',
    done: false,
    priority: 3,
    created_at: '2025-05-28T12:00:00Z',
    updated_at: '2025-05-28T12:00:00Z',
  },
  {
    id: 't4000000-0000-0000-0000-000000000005',
    project_id: 'p2000000-0000-0000-0000-000000000002',
    payment_id: null,
    title: 'Hand off staging site credentials',
    reason: null,
    due_date: '2025-05-16',
    done: true,
    priority: null,
    created_at: '2025-05-10T09:00:00Z',
    updated_at: '2025-05-16T14:00:00Z',
  },
];

// ─── Files ────────────────────────────────────────────────────────────────────

export const demoFiles: ProjectFile[] = [
  {
    id: 'f5000000-0000-0000-0000-000000000001',
    client_id: 'c1000000-0000-0000-0000-000000000002',
    project_id: 'p2000000-0000-0000-0000-000000000002',
    storage_path: 'clients/c1000000-0000-0000-0000-000000000002/clarity-contract.pdf',
    original_filename: 'Clarity_Branding_Contract_2025.pdf',
    category: 'contract',
    extracted_fields: { signed_date: '2025-02-01', value: 7200 },
    uploaded_at: '2025-02-01T10:00:00Z',
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'f5000000-0000-0000-0000-000000000002',
    client_id: 'c1000000-0000-0000-0000-000000000001',
    project_id: 'p2000000-0000-0000-0000-000000000001',
    storage_path: 'clients/c1000000-0000-0000-0000-000000000001/webb-invoice-001.pdf',
    original_filename: 'Invoice_Webb_001.pdf',
    category: 'invoice',
    extracted_fields: { invoice_number: 'INV-001', amount: 2250 },
    uploaded_at: '2025-04-02T11:00:00Z',
    created_at: '2025-04-02T11:00:00Z',
    updated_at: '2025-04-02T11:00:00Z',
  },
];

// ─── Agent Actions ────────────────────────────────────────────────────────────

export const demoAgentActions: AgentAction[] = [
  {
    id: 'aa600000-0000-0000-0000-000000000001',
    type: 'draft_reminder',
    payload: {
      payment_id: 'pay30000-0000-0000-0000-000000000001',
      client_email: 'nia@claritybrand.com',
      subject: 'Invoice reminder — Website Redesign deposit',
      body: 'Hi Nia, this is a friendly reminder that your invoice of $3,600 was due on May 20. Please let us know if you have any questions.',
    },
    display_text: 'Send payment reminder to Nia Clarke for $3,600 overdue invoice',
    status: 'pending',
    approved_at: null,
    dismissed_at: null,
    created_at: '2025-06-06T07:00:00Z',
    updated_at: '2025-06-06T07:00:00Z',
  },
  {
    id: 'aa600000-0000-0000-0000-000000000002',
    type: 'update_stage',
    payload: {
      project_id: 'p2000000-0000-0000-0000-000000000001',
      new_stage: 'awaiting_payment',
    },
    display_text: 'Move "Brand Refresh — Webb Creative" to Awaiting Payment (milestone delivered)',
    status: 'pending',
    approved_at: null,
    dismissed_at: null,
    created_at: '2025-06-06T07:05:00Z',
    updated_at: '2025-06-06T07:05:00Z',
  },
];

// ─── Today response ───────────────────────────────────────────────────────────

const overdueClient = { name: 'Nia Clarke', email: 'nia@claritybrand.com', company: 'Clarity Branding' };
const soonClient1   = { name: 'Marcus Webb', email: 'marcus@webbcreative.co', company: 'Webb Creative Co.' };
const soonClient2   = { name: 'Marcus Webb', email: 'marcus@webbcreative.co', company: 'Webb Creative Co.' };

export const demoTodayData = {
  overdue_payments: [
    { ...demoPayments[0], clients: overdueClient },
  ],
  soon_due_payments: [
    { ...demoPayments[1], clients: soonClient1 },
    { ...demoPayments[2], clients: soonClient2 },
  ],
  open_tasks: demoTasks
    .filter(t => !t.done)
    .map(t => {
      const project = demoProjects.find(p => p.id === t.project_id)!;
      const client  = demoClients.find(c => c.id === project.client_id)!;
      return { ...t, projects: { title: project.title, client_id: project.client_id, clients: { name: client.name } } };
    }),
  pipeline_counts: {
    intake: 1,
    in_progress: 2,
    awaiting_payment: 1,
    done: 0,
  },
};
