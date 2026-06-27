import { MODULE_IDS, type ModuleId } from './schemas/module-ids';

export interface ModuleMeta {
  id: ModuleId;
  order: number; // 1-based; module 1 unlocked by default, each unlocks on prior gate pass
  num: string; // display tag e.g. "M1"
  name: string;
  short: string; // one-line scope
  colorHue: number; // 0-360, used for card/ring/news-tag accents
  topicNumbers: number[]; // which of the 22 topics this module owns
  objectives: string[];
  keywords: string[]; // used by the daily pipeline's deterministic module mapper
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'foundations-prompts-to-harnesses',
    order: 1,
    num: 'M1',
    name: 'From Prompts to Harnesses',
    short: 'The mental model: prompt ⊂ context ⊂ harness, and why outer layers dominate.',
    colorHue: 190,
    topicNumbers: [1, 2],
    objectives: [
      'Distinguish prompt vs context vs harness engineering by scope',
      'Apply write / select / compress / isolate under a fixed token budget',
      'Diagnose context failure modes (poisoning, distraction, confusion, clash)',
    ],
    keywords: ['agent', 'harness', 'context window', 'context engineering', 'prompt', 'orchestration', 'scaffold', 'memory', 'tool loop'],
  },
  {
    id: 'inference-internals-performance',
    order: 2,
    num: 'M2',
    name: 'Inference Internals & Performance',
    short: 'KV cache, prefill vs decode, PagedAttention, continuous batching, caching.',
    colorHue: 210,
    topicNumbers: [3, 4],
    objectives: [
      'Explain why decode is bandwidth-bound and prefill is compute-bound',
      'Estimate KV-cache memory and why it (not weights) caps concurrency',
      'Contrast prompt/prefix caching with semantic caching and their risks',
    ],
    keywords: ['kv cache', 'pagedattention', 'vllm', 'batching', 'prefill', 'decode', 'throughput', 'ttft', 'latency', 'prompt caching', 'inference server', 'tgi'],
  },
  {
    id: 'model-efficiency-compression',
    order: 3,
    num: 'M3',
    name: 'Model Efficiency & Compression',
    short: 'Speculative decoding, quantization (INT8/INT4/FP8, GPTQ/AWQ), distillation.',
    colorHue: 265,
    topicNumbers: [5, 6, 7],
    objectives: [
      'Use the bandwidth-bound lens to unify spec-decoding / quantization / distillation',
      'Compute precision footprints and distinguish weight-only from weight+activation quant',
      'Predict when quantization hurts quality and pick evals that surface it',
    ],
    keywords: ['quantization', 'int4', 'int8', 'fp8', 'gptq', 'awq', 'speculative decoding', 'eagle', 'medusa', 'distillation', 'gguf', 'llama.cpp'],
  },
  {
    id: 'reliable-structured-output-tool-calling',
    order: 4,
    num: 'M4',
    name: 'Structured Output & Tool Calling',
    short: 'The guarantee ladder, constrained decoding, repair loops, tool idempotency.',
    colorHue: 150,
    topicNumbers: [8, 9],
    objectives: [
      'Order the structured-output guarantee ladder and place constrained decoding on it',
      'Design tool contracts with argument validation and idempotency',
      'Build a repair loop and fallback chain for malformed output',
    ],
    keywords: ['structured output', 'json schema', 'function calling', 'tool use', 'constrained decoding', 'grammar', 'idempotency', 'json mode', 'pydantic', 'outlines'],
  },
  {
    id: 'agent-control-routing-degradation',
    order: 5,
    num: 'M5',
    name: 'Agent Control, Routing & Degradation',
    short: 'Bounded loops, the five budgets, guardrails, routing, retry vs fallback.',
    colorHue: 25,
    topicNumbers: [10, 11, 12, 13],
    objectives: [
      'Bound an agent loop with the five layered budgets and clear termination states',
      'Distinguish retry from fallback with backoff, jitter, and circuit breakers',
      'Design a routing strategy and a degraded-mode UX ladder',
    ],
    keywords: ['agent loop', 'guardrails', 'model routing', 'fallback', 'circuit breaker', 'retry', 'budget', 'termination', 'degraded mode', 'tripwire'],
  },
  {
    id: 'rag-retrieval',
    order: 6,
    num: 'M6',
    name: 'RAG & Retrieval',
    short: 'Chunking, embeddings, hybrid search, RRF, reranking, freshness, retrieval evals.',
    colorHue: 330,
    topicNumbers: [14, 15, 16],
    objectives: [
      'Design a chunking + embedding strategy and reason about bi-encoder search',
      'Combine BM25 + dense with RRF fusion and a cross-encoder reranker',
      'Measure retrieval with recall/precision and grounding/citation quality',
    ],
    keywords: ['rag', 'retrieval', 'embeddings', 'vector search', 'reranking', 'hybrid search', 'bm25', 'chunking', 'cross-encoder', 'grounding', 'citation', 'rrf'],
  },
  {
    id: 'eval-observability',
    order: 7,
    num: 'M7',
    name: 'Evaluation & Observability',
    short: 'Golden/regression/adversarial/judge/human evals; traces, spans, drift, the loop.',
    colorHue: 95,
    topicNumbers: [17, 18],
    objectives: [
      'Choose eval types (golden, regression, adversarial, LLM-judge, human)',
      'Instrument traces/spans and token/latency/error telemetry',
      'Detect drift and close the eval → observability loop',
    ],
    keywords: ['eval', 'evals', 'llm-as-judge', 'observability', 'tracing', 'spans', 'telemetry', 'drift', 'regression test', 'golden set', 'langsmith', 'opentelemetry'],
  },
  {
    id: 'production-ops-cost-safety-multitenancy',
    order: 8,
    num: 'M8',
    name: 'Production Ops: Cost, Safety & Multi-Tenancy',
    short: 'Cost attribution & unit economics, prompt injection, isolation & cache safety.',
    colorHue: 0,
    topicNumbers: [19, 20, 21],
    objectives: [
      'Attribute cost across the call graph and compute per-feature unit economics',
      'Defend against prompt injection and the lethal trifecta',
      'Enforce multi-tenant isolation and cache safety to prevent contamination',
    ],
    keywords: ['cost', 'unit economics', 'prompt injection', 'jailbreak', 'data leakage', 'multi-tenant', 'isolation', 'cache poisoning', 'pii', 'security', 'authorization'],
  },
  {
    id: 'capstone-strategy-tradeoffs-failure-modes',
    order: 9,
    num: 'M9',
    name: 'Strategy, Tradeoffs & Failure Modes',
    short: 'Adaptation choice (FT vs ICL vs RAG vs distill), the tradeoff surface, capstone.',
    colorHue: 45,
    topicNumbers: [20, 21, 22, 5, 3],
    objectives: [
      'Choose between fine-tuning, in-context learning, RAG, and distillation',
      'Navigate the latency/quality/cost/reliability tradeoff surface end-to-end',
      'Recognize the canonical production failure modes and their early signals',
    ],
    keywords: ['fine-tuning', 'lora', 'in-context learning', 'rag vs fine-tuning', 'tradeoff', 'failure mode', 'hallucination', 'regression', 'strategy', 'inference stack'],
  },
];

export const MODULE_BY_ID: Record<ModuleId, ModuleMeta> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
) as Record<ModuleId, ModuleMeta>;

export const MODULE_ORDER: ModuleId[] = [...MODULES].sort((a, b) => a.order - b.order).map((m) => m.id);

// sanity: taxonomy must list every id exactly once
if (MODULES.length !== MODULE_IDS.length) {
  throw new Error(`modules.ts: expected ${MODULE_IDS.length} modules, got ${MODULES.length}`);
}
