import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, FileText, FileImage, File as FileIcon, Trash2 } from 'lucide-react';
import { listFiles, uploadFile, deleteFile } from '../api/files';
import { listClients } from '../api/clients';
import { listProjects } from '../api/projects';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import type { FileCategory, ProjectFile } from '@delroy/types';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext ?? '')) return <FileImage size={16} className="text-blue-500" />;
  if (['pdf','doc','docx','txt','md'].includes(ext ?? '')) return <FileText size={16} className="text-gray-500" />;
  return <FileIcon size={16} className="text-gray-400" />;
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => listClients('active') });
  const [clientId, setClientId] = useState('');
  const { data: projects = [] } = useQuery({ queryKey: ['projects', clientId], queryFn: () => listProjects({ client_id: clientId }), enabled: !!clientId });
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<FileCategory>('other');

  const upload = useMutation({
    mutationFn: () => uploadFile({ file: file!, client_id: clientId, project_id: projectId || undefined, category }),
    onSuccess: () => { toast('success', 'File uploaded'); qc.invalidateQueries({ queryKey: ['files-all'] }); onClose(); },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <Modal title="Upload file" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project (optional)</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!clientId} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50">
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
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => upload.mutate()} disabled={!file || !clientId || upload.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{upload.isPending ? 'Uploading…' : 'Upload'}</button>
        </div>
      </div>
    </Modal>
  );
}

const CATEGORIES: { key: FileCategory | 'all'; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'contract',    label: 'Contracts'   },
  { key: 'invoice',     label: 'Invoices'    },
  { key: 'receipt',     label: 'Receipts'    },
  { key: 'deliverable', label: 'Deliverables'},
  { key: 'other',       label: 'Other'       },
];

export default function FilesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [catFilter, setCatFilter] = useState<FileCategory | 'all'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const { data: files = [], isLoading } = useQuery({ queryKey: ['files-all'], queryFn: () => listFiles() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => listClients() });
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  const filtered: ProjectFile[] = catFilter === 'all' ? files : files.filter(f => f.category === catFilter);

  const del = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => { toast('success', 'File deleted'); qc.invalidateQueries({ queryKey: ['files-all'] }); },
    onError: (e: Error) => toast('error', e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Files</h1>
        <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><Upload size={15} /> Upload</button>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-1">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCatFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${catFilter === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No files found.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {filtered.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0">{fileIcon(f.original_filename)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{f.original_filename}</p>
                <p className="text-xs text-gray-400">
                  <Link to={`/clients/${f.client_id}`} className="hover:underline">{clientMap[f.client_id] ?? '—'}</Link>
                  {' · '}{f.category}{' · '}{fmtDate(f.uploaded_at)}
                </p>
              </div>
              <button
                onClick={() => del.mutate(f.id)}
                disabled={del.isPending}
                className="shrink-0 rounded p-1 text-gray-300 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
