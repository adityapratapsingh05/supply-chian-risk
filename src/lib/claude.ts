import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export { hasApiKey };

const MAX_RETRIES = 3;

/**
 * Call Claude with structured JSON output, retrying on malformed responses.
 */
export async function claudeStructured<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>,
  retries = MAX_RETRIES
): Promise<{ data: T; usedMockData: false }> {
  if (!hasApiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const cl = getClient();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await cl.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no code blocks, no explanation — just the raw JSON object.',
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Strip markdown code blocks if model wraps output
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);
      return { data: validated, usedMockData: false };
    } catch (err) {
      if (attempt === retries) {
        throw new Error(`Claude structured call failed after ${retries} attempts: ${err}`);
      }
      // Brief backoff before retry
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  throw new Error('Claude structured call exhausted all retries');
}

/**
 * Call Claude for free-text responses (briefing generation, etc.)
 */
export async function claudeText(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (!hasApiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const cl = getClient();
  const response = await cl.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
