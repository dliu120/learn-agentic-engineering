// M5 — five layered budgets bound an agent loop. As iterations run, budgets deplete; the first
// to hit zero forces termination (exhaustion) — never an infinite loop.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const BUDGETS = ['iterations', 'tool calls', 'tokens', 'cost ($)', 'wall-clock'];
// remaining fraction per budget across 6 ticks; tokens runs out first → terminate.
const TRACE = [
  [1, 1, 1, 1, 1],
  [0.83, 0.8, 0.74, 0.78, 0.85],
  [0.66, 0.6, 0.5, 0.56, 0.7],
  [0.5, 0.5, 0.28, 0.4, 0.55],
  [0.33, 0.3, 0.12, 0.22, 0.4],
  [0.16, 0.2, 0.0, 0.08, 0.25],
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 250,
    L = 100,
    top = 30,
    rowH = 30,
    gap = 10,
    barW = W - L - 90;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'Five budget bars — iterations, tool calls, tokens, cost, wall-clock — deplete as the agent loops; tokens hits zero first and terminates the run.');

  const bars = BUDGETS.map((b, i) => {
    const y = top + i * (rowH + gap);
    const lab = svgEl('text', { x: L - 10, y: y + rowH / 2 + 4, 'text-anchor': 'end', fill: cssColor('--text-muted'), 'font-size': 12, 'font-family': 'JetBrains Mono, monospace' });
    lab.textContent = b;
    svg.append(lab);
    svg.append(svgEl('rect', { x: L, y, width: barW, height: rowH, rx: 4, fill: cssColor('--surface-2') }));
    const fill = svgEl('rect', { x: L, y, width: barW, height: rowH, rx: 4, fill: cssColor('--accent', 0.8) });
    (fill.style as CSSStyleDeclaration).transition = 'width .5s ease, fill .3s';
    svg.append(fill);
    const pct = svgEl('text', { x: L + barW + 8, y: y + rowH / 2 + 4, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    svg.append(pct);
    return { fill, pct, barW };
  });

  const status = svgEl('text', { x: L, y: H - 12, fill: cssColor('--text-muted'), 'font-size': 12, 'font-weight': 600, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(status);
  stage.append(svg);
  root.append(stage);

  const render = (i: number) => {
    const row = TRACE[i];
    let dead = -1;
    row.forEach((frac, j) => {
      bars[j].fill.setAttribute('width', String(frac * barW));
      const empty = frac <= 0.001;
      bars[j].fill.setAttribute('fill', empty ? cssColor('--signal-bad', 0.9) : frac < 0.25 ? cssColor('--signal-warn', 0.9) : cssColor('--accent', 0.8));
      bars[j].pct.textContent = `${Math.round(frac * 100)}%`;
      if (empty && dead < 0) dead = j;
    });
    status.textContent = dead >= 0 ? `⛔ terminate: "${BUDGETS[dead]}" budget exhausted (tick ${i})` : `running… loop tick ${i}`;
    status.setAttribute('fill', dead >= 0 ? cssColor('--signal-bad') : cssColor('--text-muted'));
  };

  mountStepper(root, stage, {
    steps: TRACE.map((_, i) => ({ label: `tick ${i}`, caption: i === TRACE.length - 1 ? 'The token budget hits zero first → the loop terminates with an explicit "exhaustion" state, not a runaway.' : `Loop tick ${i}: every budget ticks down together.` })),
    onStep: render,
    reduced,
    loop: true,
    autoMs: 2200,
  });
}
