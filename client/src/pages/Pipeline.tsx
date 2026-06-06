import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors,
  DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical } from 'lucide-react';
import { listProjects, updateProject, createProject } from '../api/projects';
import { listPayments } from '../api/payments';
import { listClients } from '../api/clients';
import { PaymentDot } from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { Project, ProjectStage, Payment } from '@delroy/types';

const STAGES: { key: ProjectStage; label: string }[] = [
  { key: 'intake',           label: 'Intake'           },
  { key: 'in_progress',      label: 'In Progress'      },
  { key: 'awaiting_payment', label: 'Awaiting Payment' },
  { key: 'done',             label: 'Done'             },
];

function paymentStatus(payments: Payment[], projectId: string) {
  const pp = payments.filter(p => p.project_id === projectId);
  if (!pp.length) return null;
  if (pp.some(p => {
    const od = p.due_date && new Date(p.due_date) < new Date();
    return p.status !== 'paid' && od;
  })) return 'overdue' as const;
  if (pp.some(p => p.status === 'sent'))   return 'sent'   as const;
  if (pp.some(p => p.status === 'unpaid')) return 'unpaid' as const;
  return 'paid' as const;
}

// ── Draggable card ───────────────────────────────────────────────────────────
function ProjectCard({
  project,
  payments,
  clientName,
}: {
  project: Project;
  payments: Payment[];
  clientName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const pStatus = paymentStatus(payments, project.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${
        isDragging ? 'opacity-50 shadow-xl' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {pStatus && <PaymentDot status={pStatus} />}
            <Link
              to={`/clients/${project.client_id}`}
              className="text-xs text-gray-500 hover:underline truncate"
              onClick={e => e.stopPropagation()}
            >
              {clientName}
            </Link>
          </div>
          <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">{project.title}</p>
          {project.value != null && (
            <p className="mt-0.5 text-xs text-gray-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.value)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add project modal ────────────────────────────────────────────────────────
function AddProjectModal({ defaultStage, onClose }: { defaultStage: ProjectStage; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => listClients('active') });
  const [form, setForm] = useState({ client_id: '', title: '', stage: defaultStage, value: '' });

  const add = useMutation({
    mutationFn: () => createProject({
      client_id: form.client_id,
      title: form.title,
      stage: form.stage,
      value: form.value ? Number(form.value) : undefined,
    }),
    onSuccess: () => {
      toast('success', 'Project created');
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <Modal title="Add project" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
          <select
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select client…</option>
            {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value as ProjectStage }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Value ($)</label>
            <input
              type="number"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => add.mutate()}
            disabled={!form.client_id || !form.title || add.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {add.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main board ───────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addStage, setAddStage] = useState<ProjectStage | null>(null);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => listProjects() });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => listPayments() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => listClients() });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const moveProject = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ProjectStage }) =>
      updateProject(id, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (e: Error) => toast('error', e.message),
  });

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const targetStage = over.id as ProjectStage;
    const project = projects.find(p => p.id === active.id);
    if (project && STAGES.some(s => s.key === targetStage) && project.stage !== targetStage) {
      moveProject.mutate({ id: project.id, stage: targetStage });
    }
  }

  const activeProject = projects.find(p => p.id === activeId);

  return (
    <div className="flex h-full overflow-x-auto px-4 py-6 pb-24 md:pb-6 gap-4">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {STAGES.map(({ key, label }) => {
          const columnProjects = projects.filter(p => p.stage === key);
          return (
            <div
              key={key}
              className="flex w-64 shrink-0 flex-col rounded-xl bg-gray-100 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {columnProjects.length}
                </span>
              </div>

              {/* droppable zone */}
              <SortableContext
                id={key}
                items={columnProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  id={key}
                  className="flex flex-1 flex-col gap-2 min-h-[4rem]"
                  onDragOver={e => e.preventDefault()}
                >
                  {columnProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      payments={payments}
                      clientName={clientMap[project.client_id] ?? '—'}
                    />
                  ))}
                </div>
              </SortableContext>

              <button
                onClick={() => setAddStage(key)}
                className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-200"
              >
                <Plus size={13} /> Add project
              </button>
            </div>
          );
        })}

        <DragOverlay>
          {activeProject && (
            <div className="rotate-2 rounded-lg border border-blue-300 bg-white p-3 shadow-xl opacity-90">
              <p className="text-sm font-medium text-gray-900">{activeProject.title}</p>
              <p className="text-xs text-gray-500">{clientMap[activeProject.client_id] ?? '—'}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {addStage && (
        <AddProjectModal defaultStage={addStage} onClose={() => setAddStage(null)} />
      )}
    </div>
  );
}
