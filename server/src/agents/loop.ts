/**
 * Hand-written Anthropic tool-calling loop.
 * Pattern: trigger → messages loop → tool execution → human confirmation.
 * No agent framework — spec explicitly forbids it.
 */
import { anthropic, AGENT_MODEL } from '../lib/anthropic';
import type Anthropic from '@anthropic-ai/sdk';

export type ToolExecutor = (name: string, input: Record<string, unknown>) => Promise<unknown>;

export interface LoopResult {
  text: string;
  toolCallCount: number;
}

export async function runAgentLoop(
  system: string,
  userMessage: string,
  tools: Anthropic.Tool[],
  executeTool: ToolExecutor,
  maxIterations = 10,
): Promise<LoopResult> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];
  let toolCallCount = 0;
  let iterations = 0;

  while (iterations++ < maxIterations) {
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('\n');
      return { text, toolCallCount };
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async block => {
          toolCallCount++;
          try {
            const result = await executeTool(block.name, block.input as Record<string, unknown>);
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          } catch (err) {
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify({ error: String(err) }),
              is_error: true,
            };
          }
        }),
      );

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // max_tokens or other stop — return what we have
    break;
  }

  return { text: 'Agent loop ended without completing.', toolCallCount };
}
