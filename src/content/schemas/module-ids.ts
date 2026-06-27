// Single source of truth for the 9 module ids. Imported by content config,
// the module taxonomy, AND the daily pipeline so ids never drift.
export const MODULE_IDS = [
  'foundations-prompts-to-harnesses',
  'inference-internals-performance',
  'model-efficiency-compression',
  'reliable-structured-output-tool-calling',
  'agent-control-routing-degradation',
  'rag-retrieval',
  'eval-observability',
  'production-ops-cost-safety-multitenancy',
  'capstone-strategy-tradeoffs-failure-modes',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];
export const isModuleId = (s: string): s is ModuleId =>
  (MODULE_IDS as readonly string[]).includes(s);
