// ─── Enums ───────────────────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'archived';

export type ProjectStage = 'intake' | 'in_progress' | 'awaiting_payment' | 'done';

export type PaymentStatus = 'unpaid' | 'sent' | 'overdue' | 'paid';

export type FileCategory = 'contract' | 'invoice' | 'receipt' | 'deliverable' | 'other';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  stage: ProjectStage;
  value: number | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  client_id: string;
  project_id: string | null;
  storage_path: string;
  original_filename: string;
  category: FileCategory;
  extracted_fields: Record<string, unknown> | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  payment_id: string | null;
  title: string;
  reason: string | null;
  due_date: string | null;
  done: boolean;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Create/update DTOs ───────────────────────────────────────────────────────

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: ClientStatus;
  notes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface CreateProjectDto {
  client_id: string;
  title: string;
  stage?: ProjectStage;
  value?: number;
  start_date?: string;
  due_date?: string;
}

export interface UpdateProjectDto extends Partial<Omit<CreateProjectDto, 'client_id'>> {}

export interface CreatePaymentDto {
  project_id: string;
  client_id: string;
  amount: number;
  description?: string;
  due_date?: string;
  status?: PaymentStatus;
}

export interface UpdatePaymentDto extends Partial<Omit<CreatePaymentDto, 'project_id' | 'client_id'>> {
  paid_at?: string | null;
  reminder_sent_at?: string | null;
}

export interface CreateFileDto {
  client_id: string;
  project_id?: string;
  storage_path: string;
  original_filename: string;
  category?: FileCategory;
  extracted_fields?: Record<string, unknown>;
}

export interface UpdateFileDto extends Partial<Omit<CreateFileDto, 'client_id'>> {}

export interface CreateTaskDto {
  project_id: string;
  payment_id?: string;
  title: string;
  reason?: string;
  due_date?: string;
  done?: boolean;
  priority?: number;
}

export interface UpdateTaskDto extends Partial<Omit<CreateTaskDto, 'project_id'>> {}

// ─── Agent types (Phase 3) ────────────────────────────────────────────────────

export type AgentActionStatus = 'pending' | 'approved' | 'dismissed';

export type AgentActionType =
  | 'draft_reminder'
  | 'file_document'
  | 'update_stage'
  | 'mark_paid'
  | 'create_task'
  | 'nl_update'
  | 'nl_query_result';

export interface AgentAction {
  id: string;
  type: AgentActionType;
  payload: Record<string, unknown>;
  display_text: string;
  status: AgentActionStatus;
  approved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
