import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set — agents will not function');
}

export const anthropic = new Anthropic({ apiKey: apiKey ?? 'missing' });

export const AGENT_MODEL = 'claude-sonnet-4-6';
