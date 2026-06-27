// M7 — the closed eval+observability loop. Ship → trace → detect drift → eval → fix → ship.
// Observability without evals is blind; evals without observability are stale.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const NODES = [
  { t: 'Ship', d: 'Release a prompt/model/pipeline change.' },
  { t: 'Trace', d: 'Capture spans, tokens, latency, errors per request.' },
  { t: 'Detect', d: 'Watch for drift: provider updates, data shift, silent 200-OK failures.' },
  { t: 'Eval', d: 'Run golden + regression + adversarial + LLM-judge suites.' },
  { t: 'Fix', d: 'Patch, add a regression case, and ship again.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 320,
    cx = W / 2,
    cy = H / 2,
    R = 105;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'A five-node closed loop: ship, trace, detect drift, evaluate, fix, then ship again.');

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length;
  svg.append(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: cssColor('--border'), 'stroke-width': 2, 'stroke-dasharray': '4 6' }));

  const nodeEls = NODES.map((n, i) => {
    const x = cx + R * Math.cos(angle(i));
    const y = cy + R * Math.sin(angle(i));
    const g = svgEl('g', { transform: `translate(${x} ${y})` });
    const c = svgEl('circle', { r: 30, fill: cssColor('--surface-2'), stroke: cssColor('--border'), 'stroke-width': 1.5 });
    const t = svgEl('text', { 'text-anchor': 'middle', dy: '0.35em', fill: cssColor('--text-muted'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = n.t;
    g.append(c, t);
    svg.append(g);
    return { c, t };
  });

  const center = svgEl('text', { x: cx, y: cy, 'text-anchor': 'middle', dy: '0.35em', fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  center.textContent = 'closed loop';
  svg.append(center);

  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const place = (idx: number) =>
    nodeEls.forEach((ne, j) => {
      const on = j === idx;
      ne.c.setAttribute('stroke', on ? accent : cssColor('--border'));
      ne.c.setAttribute('stroke-width', on ? '2.5' : '1.5');
      ne.c.setAttribute('fill', on ? cssColor('--accent', 0.14) : cssColor('--surface-2'));
      ne.t.setAttribute('fill', on ? accent : cssColor('--text-muted'));
    });

  mountStepper(root, stage, {
    steps: NODES.map((n) => ({ label: n.t, caption: `${n.t} — ${n.d}` })),
    onStep: place,
    reduced,
    loop: true,
    autoMs: 1900,
  });
}
