/**
 * Agent A — File intake & auto-filing
 * Trigger: file uploaded (POST /api/v1/agent-actions/run-file-intake)
 * Reads the uploaded file record, classifies it, matches a client, creates
 * a review task, then stores an agent_action for human confirmation.
 * Read-only on the world — the "fileDocument" tool only creates the action record.
 */
import { supabase } from '../lib/supabase';
import { runAgentLoop } from './loop';
import type Anthropic from '@anthropic-ai/sdk';

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'getFile',
    description: 'Retrieve file metadata and storage path by ID',
    input_schema: { type: 'object', properties: { file_id: { type: 'string' } }, required: ['file_id'] },
  },
  {
    name: 'getClients',
    description: 'List all active clients for matching',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'classifyDocument',
    description: 'Classify a document based on its filename and any available text. Returns category and extracted fields.',
    input_schema: {
      type: 'object',
      properties: {
        filename:   { type: 'string' },
        text_hint:  { type: 'string', description: 'Any available text snippet from the doc' },
      },
      required: ['filename'],
    },
  },
  {
    name: 'proposeFilingAction',
    description: 'Create an agent_action record proposing to file this document under a client/project. Requires human approval.',
    input_schema: {
      type: 'object',
      properties: {
        file_id:         { type: 'string' },
        client_id:       { type: 'string' },
        project_id:      { type: 'string' },
        category:        { type: 'string' },
        extracted_fields:{ type: 'object' },
        display_text:    { type: 'string' },
      },
      required: ['file_id', 'client_id', 'category', 'display_text'],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'getFile') {
    const { data } = await supabase.from('files').select('*').eq('id', input.file_id).single();
    return data;
  }
  if (name === 'getClients') {
    const { data } = await supabase.from('clients').select('id, name, email, company').eq('status', 'active');
    return data;
  }
  if (name === 'classifyDocument') {
    // The LLM classifies the doc itself; this tool is a no-op passthrough
    // so the model can signal its classification decision explicitly.
    return { acknowledged: true, filename: input.filename };
  }
  if (name === 'proposeFilingAction') {
    const { data, error } = await supabase
      .from('agent_actions')
      .insert({
        type: 'file_document',
        payload: {
          file_id:         input.file_id,
          client_id:       input.client_id,
          project_id:      input.project_id ?? null,
          category:        input.category,
          extracted_fields:input.extracted_fields ?? {},
        },
        display_text: input.display_text,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function runFileIntakeAgent(fileId: string) {
  const system = `You are a file intake assistant for a service business.
Your job: given a newly uploaded file, identify which client it belongs to, classify the document type, extract key fields, and propose filing it appropriately.
Be conservative: if unsure about the client match, say so in display_text. Always call proposeFilingAction with your best guess so the human can review.
Available categories: contract, invoice, receipt, deliverable, other.`;

  const userMessage = `A new file has been uploaded with ID: ${fileId}
1. Call getFile to see its metadata.
2. Call getClients to find matching clients.
3. Use classifyDocument to decide the category.
4. Call proposeFilingAction to create a review card for the human.`;

  return runAgentLoop(system, userMessage, TOOLS, executeTool);
}
