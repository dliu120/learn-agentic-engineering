// name → lazy loader. VizWrapper.astro looks names up here and calls init().
export interface VizModule {
  init: (root: HTMLElement, opts: { reduced: boolean }) => void;
}

// NOTE: every name here must map to a real file (Vite resolves these import() calls at build).
// Names referenced in content but absent here degrade gracefully to the text-equivalent summary.
export const vizRegistry: Record<string, () => Promise<VizModule>> = {
  'harness-loop': () => import('./harness-loop'),
  'context-budget': () => import('./context-budget'),
  'prefill-decode': () => import('./prefill-decode'),
  'kv-cache': () => import('./kv-cache'),
  'quant-cliff': () => import('./quant-cliff'),
  'guarantee-ladder': () => import('./guarantee-ladder'),
  'agent-budgets': () => import('./agent-budgets'),
  'retrieval-funnel': () => import('./retrieval-funnel'),
  'eval-loop': () => import('./eval-loop'),
  'lethal-trifecta': () => import('./lethal-trifecta'),
  'tradeoff-radar': () => import('./tradeoff-radar'),
};
