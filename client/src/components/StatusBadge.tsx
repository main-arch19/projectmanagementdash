import type { PaymentStatus, ProjectStage, ClientStatus } from '@delroy/types';

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  overdue: 'bg-red-100 text-red-800 border border-red-200',
  unpaid:  'bg-amber-100 text-amber-800 border border-amber-200',
  sent:    'bg-blue-100 text-blue-800 border border-blue-200',
  paid:    'bg-green-100 text-green-800 border border-green-200',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  overdue: 'Overdue',
  unpaid:  'Unpaid',
  sent:    'Sent',
  paid:    'Paid',
};

const STAGE_STYLES: Record<ProjectStage, string> = {
  intake:           'bg-gray-100 text-gray-700 border border-gray-200',
  in_progress:      'bg-blue-100 text-blue-800 border border-blue-200',
  awaiting_payment: 'bg-amber-100 text-amber-800 border border-amber-200',
  done:             'bg-green-100 text-green-800 border border-green-200',
};

const STAGE_LABELS: Record<ProjectStage, string> = {
  intake:           'Intake',
  in_progress:      'In Progress',
  awaiting_payment: 'Awaiting Payment',
  done:             'Done',
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STYLES[status]}`}>
      {PAYMENT_LABELS[status]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: ProjectStage }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      status === 'active'
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }`}>
      {status === 'active' ? 'Active' : 'Archived'}
    </span>
  );
}

/** Coloured dot for payment status — used on pipeline cards */
export function PaymentDot({ status }: { status: PaymentStatus }) {
  const colors: Record<PaymentStatus, string> = {
    overdue: 'bg-red-500',
    unpaid:  'bg-amber-400',
    sent:    'bg-blue-400',
    paid:    'bg-green-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />;
}
