import { MODULE_IDS, type ModuleId } from './schemas/module-ids';

export const TRACK_IDS = ['fundamentals', 'core-stages', 'agent-capabilities', 'production-deep-dives'] as const;
export type CurriculumTrackId = (typeof TRACK_IDS)[number];

export interface CurriculumTrack {
  id: CurriculumTrackId;
  name: string;
  short: string;
  order: number;
  defaultOpen: boolean;
}

export interface ModuleMeta {
  id: ModuleId;
  order: number;
  num: string;
  name: string;
  short: string;
  why: string;
  track: CurriculumTrackId;
  prerequisites: ModuleId[];
  estimatedSessions: string;
  topicNumbers: number[];
  objectives: string[];
  keywords: string[];
}

export const TOTAL_TOPIC_COUNT = 32;

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    short: 'The shared mental model: model calls, context windows, retrieval, state, memory, tools, and agents.',
    order: 0,
    defaultOpen: true,
  },
  {
    id: 'core-stages',
    name: 'Core Stages',
    short: 'The shortest path from one model request to durable, graph-controlled systems.',
    order: 1,
    defaultOpen: true,
  },
  {
    id: 'agent-capabilities',
    name: 'Agent Capabilities',
    short: 'Reusable capabilities, interoperability, state, memory, and executable specifications.',
    order: 2,
    defaultOpen: false,
  },
  {
    id: 'production-deep-dives',
    name: 'Production Deep Dives',
    short: 'Serving, retrieval, evaluation, safety, economics, and strategy when you need more depth.',
    order: 3,
    defaultOpen: false,
  },
];

export const MODULES: ModuleMeta[] = [
  {
    id: 'agent-engineering-fundamentals',
    order: 0,
    num: 'Primer',
    name: 'Agent Engineering Fundamentals',
    short: 'Learn the system map before choosing prompts, retrieval, memory, tools, loops, graphs, or multiple agents.',
    why: 'The later techniques are easier when context, retrieval, state, memory, and orchestration are not blurred together.',
    track: 'fundamentals',
    prerequisites: [],
    estimatedSessions: '2–3 sessions',
    topicNumbers: [],
    objectives: [
      'Trace one model request from tokens and context to a sampled response',
      'Separate context, retrieval, thread state, checkpoints, durable tasks, and long-term memory',
      'Choose the smallest control structure from one call through tools, loops, graphs, and multi-agent systems',
    ],
    keywords: ['llm fundamentals', 'agent fundamentals', 'context window basics', 'agent system map'],
  },
  {
    id: 'foundations-prompts-to-harnesses',
    order: 1,
    num: 'S1',
    name: 'Prompt Engineering',
    short: 'Design one clear model request with instructions, examples, constraints, and a realistic success test.',
    why: 'After the primer, start the five-stage path by learning what one prompt can control—and what it cannot.',
    track: 'core-stages',
    prerequisites: ['agent-engineering-fundamentals'],
    estimatedSessions: '1–2 sessions',
    topicNumbers: [1],
    objectives: [
      'Write concrete instructions with useful examples and explicit constraints',
      'Separate the user request from supporting context and system rules',
      'Know when prompt rewriting has reached its limit',
    ],
    keywords: ['prompt engineering', 'few-shot', 'few shot', 'chain of thought', 'system prompt', 'instruction following'],
  },
  {
    id: 'conversation-context-engineering',
    order: 2,
    num: 'S2',
    name: 'Conversation Engineering',
    short: 'Manage turns, roles, history, summaries, retrieval, and what carries forward between messages.',
    why: 'A good first answer is not enough when the interaction lasts more than one turn.',
    track: 'core-stages',
    prerequisites: ['foundations-prompts-to-harnesses'],
    estimatedSessions: '2 sessions',
    topicNumbers: [2],
    objectives: [
      'Design a multi-turn conversation with explicit roles and history rules',
      'Select, compress, and isolate context under a fixed token budget',
      'Distinguish conversation history from durable application state',
    ],
    keywords: ['conversation', 'chat', 'context engineering', 'context window', 'history', 'summarization', 'context rot', 'memory'],
  },
  {
    id: 'reliable-structured-output-tool-calling',
    order: 3,
    num: 'S3',
    name: 'Response Engineering',
    short: 'Turn stochastic text into typed, validated, repairable responses and safe tool requests.',
    why: 'Downstream code needs a contract, not a string that usually looks right.',
    track: 'core-stages',
    prerequisites: ['conversation-context-engineering'],
    estimatedSessions: '2 sessions',
    topicNumbers: [8, 9],
    objectives: [
      'Choose the right output guarantee for each use case',
      'Validate structured responses and repair failures with bounded retries',
      'Treat tool arguments as untrusted input and make writes idempotent',
    ],
    keywords: ['structured output', 'json schema', 'function calling', 'tool use', 'constrained decoding', 'grammar', 'idempotency', 'json mode', 'pydantic', 'outlines'],
  },
  {
    id: 'agent-control-routing-degradation',
    order: 4,
    num: 'S4',
    name: 'Loop Engineering',
    short: 'Build bounded model–tool loops with routing, retries, verification, budgets, and explicit exits.',
    why: 'Iteration creates capability, but an unbounded loop creates cost and failure.',
    track: 'core-stages',
    prerequisites: ['reliable-structured-output-tool-calling'],
    estimatedSessions: '3–4 sessions',
    topicNumbers: [10, 11, 12, 13],
    objectives: [
      'Compose model calls and tools into bounded, observable loops',
      'Choose among chaining, routing, parallel work, and evaluator loops',
      'Return success, exhaustion, and failure as different outcomes',
    ],
    keywords: ['agent', 'agent loop', 'workflow', 'orchestration', 'guardrails', 'model routing', 'fallback', 'circuit breaker', 'retry', 'budget', 'termination', 'degraded mode', 'tripwire'],
  },
  {
    id: 'graph-workflow-engineering',
    order: 5,
    num: 'S5',
    name: 'Graph Engineering',
    short: 'Make control flow explicit with typed state, branches, parallel nodes, cycles, subgraphs, and human gates.',
    why: 'Graphs make dependencies, waiting, retries, and failure ownership visible.',
    track: 'core-stages',
    prerequisites: ['agent-control-routing-degradation'],
    estimatedSessions: '2–3 sessions',
    topicNumbers: [23, 24, 25],
    objectives: [
      'Model workflows as nodes, edges, typed state, and termination conditions',
      'Use parallel branches and joins without creating race conditions',
      'Add checkpoints and human approval without hiding control flow',
      'Choose shared-state nodes or multi-agent handoffs based on isolation and ownership needs',
    ],
    keywords: ['langgraph', 'stategraph', 'graph workflow', 'dag', 'directed acyclic graph', 'multi-agent', 'handoff', 'orchestrator-worker', 'parallel workers', 'state machine', 'subgraph'],
  },
  {
    id: 'tools-skills-plugins-mcp',
    order: 6,
    num: 'C1',
    name: 'Skills, Plugins & MCP',
    short: 'Distinguish capabilities from packaging, then connect hosts and servers through MCP.',
    why: 'Clear boundaries prevent “tool,” “skill,” “plugin,” and “MCP server” from becoming meaningless synonyms.',
    track: 'agent-capabilities',
    prerequisites: ['reliable-structured-output-tool-calling'],
    estimatedSessions: '2 sessions',
    topicNumbers: [26, 27, 28],
    objectives: [
      'Distinguish tools, skills, plugins, and negotiated protocol extensions',
      'Explain MCP host, client, server, tool, resource, and prompt roles',
      'Choose local stdio or remote HTTP connections with explicit trust boundaries',
      'Migrate legacy HTTP+SSE integrations to version-negotiated Streamable HTTP',
    ],
    keywords: ['mcp', 'model context protocol', 'plugin', 'extension', 'agent skill', 'skills', 'mcp server', 'mcp client', 'mcp host', 'stdio'],
  },
  {
    id: 'state-memory-durable-workflows',
    order: 7,
    num: 'C2',
    name: 'State, Memory & Durability',
    short: 'Separate stateless requests, thread state, checkpoints, durable tasks, and long-term memory.',
    why: 'Most “memory” bugs come from mixing five different kinds of state.',
    track: 'agent-capabilities',
    prerequisites: ['agent-control-routing-degradation'],
    estimatedSessions: '2 sessions',
    topicNumbers: [29, 30],
    objectives: [
      'Explain why a stateless protocol can support a stateful application',
      'Choose between thread state, checkpoints, durable tasks, and long-term memory',
      'Resume interrupted work without replaying completed side effects',
    ],
    keywords: ['stateful', 'stateless', 'checkpoint', 'checkpointer', 'durable execution', 'durable agent', 'agent memory', 'agent memories', 'thread state', 'long-term memory', 'task handle', 'persistence', 'resume'],
  },
  {
    id: 'spec-driven-agent-engineering',
    order: 8,
    num: 'C3',
    name: 'Spec-Driven Agents',
    short: 'Define goals, capabilities, invariants, states, exits, and verification before implementation.',
    why: 'A long system prompt is not a testable behavior contract.',
    track: 'agent-capabilities',
    prerequisites: ['agent-control-routing-degradation'],
    estimatedSessions: '2 sessions',
    topicNumbers: [31, 32],
    objectives: [
      'Write an agent specification that separates behavior from implementation',
      'Turn invariants and state transitions into executable checks',
      'Backpropagate production failures into stronger specifications',
    ],
    keywords: ['agent spec', 'spec-driven', 'specification', 'invariant', 'state transition', 'acceptance criteria', 'executable spec', 'behavior contract'],
  },
  {
    id: 'inference-internals-performance',
    order: 9,
    num: 'D1',
    name: 'Inference & Serving',
    short: 'KV cache, prefill vs. decode, PagedAttention, continuous batching, and caching.',
    why: 'Use this path when latency, throughput, memory, or serving cost becomes the bottleneck.',
    track: 'production-deep-dives',
    prerequisites: ['foundations-prompts-to-harnesses'],
    estimatedSessions: '2 sessions',
    topicNumbers: [3, 4],
    objectives: [
      'Explain why decode is bandwidth-bound and prefill is compute-bound',
      'Estimate KV-cache memory and why it caps concurrency',
      'Contrast prompt caching with semantic caching and their risks',
    ],
    keywords: ['kv cache', 'pagedattention', 'vllm', 'batching', 'prefill', 'decode', 'throughput', 'ttft', 'latency', 'prompt caching', 'inference server', 'tgi'],
  },
  {
    id: 'model-efficiency-compression',
    order: 10,
    num: 'D2',
    name: 'Model Efficiency',
    short: 'Speculative decoding, quantization, and distillation through one bandwidth-and-quality lens.',
    why: 'Use this path when the right model is too slow, too large, or too expensive.',
    track: 'production-deep-dives',
    prerequisites: ['inference-internals-performance'],
    estimatedSessions: '3 sessions',
    topicNumbers: [5, 6, 7],
    objectives: [
      'Unify speculative decoding, quantization, and distillation by what they move less of',
      'Compute precision footprints and distinguish weight-only from activation quantization',
      'Pick evaluations that expose quality loss instead of hiding it',
    ],
    keywords: ['quantization', 'int4', 'int8', 'fp8', 'gptq', 'awq', 'speculative decoding', 'eagle', 'medusa', 'distillation', 'gguf', 'llama.cpp'],
  },
  {
    id: 'rag-retrieval',
    order: 11,
    num: 'D3',
    name: 'Retrieval & RAG',
    short: 'Semantic and lexical retrieval, hybrid search, GraphRAG, reranking, freshness, grounding, and evaluation.',
    why: 'Use this path when answers must depend on changing or private knowledge.',
    track: 'production-deep-dives',
    prerequisites: ['conversation-context-engineering'],
    estimatedSessions: '4 sessions',
    topicNumbers: [14, 15, 16],
    objectives: [
      'Design chunking and embedding strategies for the retrieval job',
      'Combine lexical and dense retrieval with fusion and reranking',
      'Choose baseline semantic, hybrid, or graph-backed retrieval based on the question shape',
      'Measure recall, freshness, grounding, and citation quality separately',
    ],
    keywords: ['rag', 'retrieval', 'embeddings', 'semantic search', 'vector search', 'reranking', 'hybrid search', 'bm25', 'chunking', 'cross-encoder', 'graphrag', 'graph rag', 'knowledge graph', 'global search', 'local search', 'grounding', 'citation', 'rrf'],
  },
  {
    id: 'eval-observability',
    order: 12,
    num: 'D4',
    name: 'Evaluation & Observability',
    short: 'Regression, adversarial, judge, and human evaluations connected to traces and production drift.',
    why: 'Use this path when you need evidence that a change improved the system.',
    track: 'production-deep-dives',
    prerequisites: ['reliable-structured-output-tool-calling'],
    estimatedSessions: '2 sessions',
    topicNumbers: [17, 18],
    objectives: [
      'Choose among golden, regression, adversarial, judge, and human evaluations',
      'Instrument traces, spans, token, latency, and error telemetry',
      'Connect production drift back to an evaluation set and a fix',
    ],
    keywords: ['eval', 'evals', 'llm-as-judge', 'observability', 'tracing', 'spans', 'telemetry', 'drift', 'regression test', 'golden set', 'langsmith', 'opentelemetry'],
  },
  {
    id: 'production-ops-cost-safety-multitenancy',
    order: 13,
    num: 'D5',
    name: 'Production Safety & Cost',
    short: 'Cost attribution, prompt injection, authorization, isolation, and cache safety.',
    why: 'Use this path before giving an agent consequential access or shared infrastructure.',
    track: 'production-deep-dives',
    prerequisites: ['agent-control-routing-degradation'],
    estimatedSessions: '3 sessions',
    topicNumbers: [19, 20, 21],
    objectives: [
      'Attribute cost across a call graph and compute per-feature unit economics',
      'Defend against prompt injection and the lethal trifecta',
      'Enforce tenant isolation and cache safety',
    ],
    keywords: ['cost', 'unit economics', 'prompt injection', 'jailbreak', 'data leakage', 'multi-tenant', 'isolation', 'cache poisoning', 'pii', 'security', 'authorization'],
  },
  {
    id: 'capstone-strategy-tradeoffs-failure-modes',
    order: 14,
    num: 'D6',
    name: 'Strategy & Tradeoffs',
    short: 'Choose adaptation, orchestration, and serving approaches across latency, quality, cost, and reliability.',
    why: 'Use this path to make architecture decisions instead of collecting techniques.',
    track: 'production-deep-dives',
    prerequisites: ['graph-workflow-engineering', 'eval-observability'],
    estimatedSessions: '1–2 sessions',
    topicNumbers: [3, 5, 20, 21, 22],
    objectives: [
      'Choose among fine-tuning, in-context learning, retrieval, and distillation',
      'Navigate the latency, quality, cost, and reliability tradeoff surface',
      'Recognize common production failure modes and their early signals',
    ],
    keywords: ['fine-tuning', 'fine tuning', 'lora', 'in-context learning', 'rag vs fine-tuning', 'tradeoff', 'failure mode', 'hallucination', 'regression', 'strategy', 'inference stack'],
  },
];

export const MODULE_BY_ID: Record<ModuleId, ModuleMeta> = Object.fromEntries(
  MODULES.map((module) => [module.id, module]),
) as Record<ModuleId, ModuleMeta>;

export const TRACK_BY_ID: Record<CurriculumTrackId, CurriculumTrack> = Object.fromEntries(
  CURRICULUM_TRACKS.map((track) => [track.id, track]),
) as Record<CurriculumTrackId, CurriculumTrack>;

export const MODULES_BY_TRACK: Record<CurriculumTrackId, ModuleMeta[]> = Object.fromEntries(
  CURRICULUM_TRACKS.map((track) => [
    track.id,
    MODULES.filter((module) => module.track === track.id).sort((a, b) => a.order - b.order),
  ]),
) as Record<CurriculumTrackId, ModuleMeta[]>;

if (MODULES.length !== MODULE_IDS.length) {
  throw new Error(`modules.ts: expected ${MODULE_IDS.length} modules, got ${MODULES.length}`);
}
