// M1 — the harness loop. Six nodes on a ring; a token packet travels and the active node glows.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const NODES = [
  { t: 'Invoke', d: 'Assemble context and call the model.' },
  { t: 'Parse', d: 'Extract structured intent / tool calls from raw text.' },
  { t: 'Execute', d: 'Run the tool in a sandbox with validated arguments.' },
  { t: 'Observe', d: 'Capture results and errors as new context.' },
  { t: 'Verify', d: 'Check the result against the goal and guardrails.' },
  { t: 'Budget?', d: 'Stop on success, exhaustion, or failure — never loop forever.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 320,
    cx = W / 2,
    cy = H / 2,
    R = 110;
  const stage = document.createElement('div');
  stage.className = 'w-full';

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'The agent harness loop: invoke, parse, execute, observe, verify, then check budget and stop.');

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length;

  // connector ring
  const ring = svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: cssColor('--border'), 'stroke-width': 2, 'stroke-dasharray': '4 6' });
  svg.append(ring);

  const nodeEls = NODES.map((n, i) => {
    const x = cx + R * Math.cos(angle(i));
    const y = cy + R * Math.sin(angle(i));
    const g = svgEl('g', { transform: `translate(${x} ${y})` });
    const c = svgEl('circle', { r: 32, fill: cssColor('--surface-2'), stroke: cssColor('--border'), 'stroke-width': 1.5 });
    const label = svgEl('text', { 'text-anchor': 'middle', dy: '0.35em', fill: cssColor('--text-muted'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    label.textContent = n.t;
    g.append(c, label);
    svg.append(g);
    return { c, label };
  });

  const packet = svgEl('circle', { r: 6, fill: cssColor('--accent'), cx, cy });
  svg.append(packet);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.14);
  const place = (idx: number) => {
    const x = cx + R * Math.cos(angle(idx));
    const y = cy + R * Math.sin(angle(idx));
    packet.setAttribute('cx', String(x));
    packet.setAttribute('cy', String(y));
    nodeEls.forEach((ne, j) => {
      const on = j === idx;
      ne.c.setAttribute('stroke', on ? accent : cssColor('--border'));
      ne.c.setAttribute('stroke-width', on ? '2.5' : '1.5');
      ne.c.setAttribute('fill', on ? accentFill : cssColor('--surface-2'));
      ne.label.setAttribute('fill', on ? accent : cssColor('--text-muted'));
    });
  };

  mountStepper(root, stage, {
    steps: NODES.map((n) => ({ label: n.t, caption: `${n.t} — ${n.d}` })),
    onStep: place,
    reduced,
    loop: true,
    autoMs: 1700,
  });
}
