import { useState } from 'react';
import { Sparkles, Check, X, Pencil } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveAgentAction, dismissAgentAction } from '../api/agentActions';
import type { AgentAction } from '@delroy/types';
import { useToast } from './Toast';

interface Props {
  action: AgentAction;
  onSettled?: () => void;
}

export default function AgentActionCard({ action, onSettled }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editedBody, setEditedBody] = useState<string>(
    typeof action.payload === 'object' && action.payload !== null && 'body' in action.payload
      ? String((action.payload as Record<string, unknown>).body)
      : '',
  );

  const approve = useMutation({
    mutationFn: () => {
      const overrides = editing && editedBody ? { body: editedBody } : undefined;
      return approveAgentAction(action.id, overrides);
    },
    onSuccess: () => {
      toast('success', 'Action approved');
      qc.invalidateQueries({ queryKey: ['agent-actions'] });
      qc.invalidateQueries({ queryKey: ['today'] });
      onSettled?.();
    },
    onError: (e: Error) => toast('error', e.message),
  });

  const dismiss = useMutation({
    mutationFn: () => dismissAgentAction(action.id),
    onSuccess: () => {
      toast('success', 'Dismissed');
      qc.invalidateQueries({ queryKey: ['agent-actions'] });
      onSettled?.();
    },
    onError: (e: Error) => toast('error', e.message),
  });

  const hasEditableBody =
    typeof action.payload === 'object' &&
    action.payload !== null &&
    'body' in (action.payload as object);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-purple-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{action.display_text}</p>

          {editing && hasEditableBody ? (
            <textarea
              className="mt-2 w-full rounded border border-gray-300 p-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={5}
              value={editedBody}
              onChange={e => setEditedBody(e.target.value)}
            />
          ) : (
            action.display_text && (
              <p className="mt-1 text-xs text-gray-500 italic">
                {action.type.replace(/_/g, ' ')}
              </p>
            )
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => approve.mutate()}
          disabled={approve.isPending || dismiss.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Check size={12} /> Approve
        </button>
        {hasEditableBody && (
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            <Pencil size={12} /> {editing ? 'Cancel edit' : 'Edit'}
          </button>
        )}
        <button
          onClick={() => dismiss.mutate()}
          disabled={approve.isPending || dismiss.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <X size={12} /> Dismiss
        </button>
      </div>
    </div>
  );
}
