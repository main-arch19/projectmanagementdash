import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Search, Sparkles } from 'lucide-react';
import { runNlUpdate, runNlQuery } from '../api/agentActions';
import { useToast } from './Toast';

type Mode = 'update' | 'query';

export default function NLInputBar() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('update');
  const [text, setText] = useState('');
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: () => runNlUpdate(text),
    onSuccess: (actions) => {
      toast('success', `${actions.length} action${actions.length !== 1 ? 's' : ''} proposed for review`);
      qc.invalidateQueries({ queryKey: ['agent-actions'] });
      setText('');
    },
    onError: (e: Error) => toast('error', e.message),
  });

  const query = useMutation({
    mutationFn: () => runNlQuery(text),
    onSuccess: (res) => {
      setQueryAnswer(res.answer);
      setText('');
    },
    onError: (e: Error) => toast('error', e.message),
  });

  const isPending = update.isPending || query.isPending;

  function handleSubmit() {
    if (!text.trim()) return;
    setQueryAnswer(null);
    if (mode === 'update') update.mutate();
    else query.mutate();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => { setMode('update'); setQueryAnswer(null); }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${mode === 'update' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles size={12} /> Update pipeline
        </button>
        <button
          onClick={() => { setMode('query'); setQueryAnswer(null); }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${mode === 'query' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Search size={12} /> Ask anything
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder={mode === 'update'
            ? 'e.g. "Finished design for Acme, they paid the deposit"'
            : 'e.g. "Who owes me money and hasn\'t been reminded?"'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isPending}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </div>

      {queryAnswer && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {queryAnswer}
        </div>
      )}
    </div>
  );
}
