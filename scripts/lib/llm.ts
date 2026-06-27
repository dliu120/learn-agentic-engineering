// Guarded Anthropic call. If ANTHROPIC_API_KEY is unset, callers fall back to deterministic
// templating — the pipeline NEVER hard-requires an LLM. Model is configurable via sources.yaml.
export const hasLLM = (): boolean => !!process.env.ANTHROPIC_API_KEY;

export interface LLMOpts {
  model?: string;
  maxTokens?: number;
  system?: string;
}

export async function llmJSON<T = unknown>(userPrompt: string, opts: LLMOpts = {}): Promise<T> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const model = opts.model ?? process.env.LLM_MODEL ?? 'claude-sonnet-4-6';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system ?? 'You are a precise assistant. Respond with valid JSON only — no prose, no code fences.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.find((c) => c.type === 'text')?.text ?? '';
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as T;
}
