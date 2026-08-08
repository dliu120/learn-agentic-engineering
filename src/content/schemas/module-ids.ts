export const MODULE_IDS = [
  'foundations-prompts-to-harnesses',
  'conversation-context-engineering',
  'reliable-structured-output-tool-calling',
  'agent-control-routing-degradation',
  'graph-workflow-engineering',
  'tools-skills-plugins-mcp',
  'state-memory-durable-workflows',
  'spec-driven-agent-engineering',
  'inference-internals-performance',
  'model-efficiency-compression',
  'rag-retrieval',
  'eval-observability',
  'production-ops-cost-safety-multitenancy',
  'capstone-strategy-tradeoffs-failure-modes',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];
export const isModuleId = (value: string): value is ModuleId =>
  (MODULE_IDS as readonly string[]).includes(value);
