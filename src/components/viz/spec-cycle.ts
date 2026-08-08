import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const NODES = [
  { label: 'Specify', note: 'Goal, capabilities, state, invariants, exits' },
  { label: 'Test', note: 'Examples and checks that can fail' },
  { label: 'Build', note: 'Prompt, tools, loop, or graph' },
  { label: 'Observe', note: 'Trace real behavior and failures' },
  { label: 'Backprop', note: 'Strengthen the spec after a failure' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 700;
  const H = 340;
  const cx = W / 2;
  const cy = 160;
  const radius = 112;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'A five-step specification feedback cycle: Specify, Test, Build, Observe, then Backpropagate failures into the specification.',
  );

  const positions = NODES.map((_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / NODES.length;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  positions.forEach((from, index) => {
    const to = positions[(index + 1) % positions.length];
    const line = svgEl('line', {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: cssColor('--border'),
      'stroke-width': 2,
      'stroke-dasharray': '4 5',
    });
    svg.append(line);
  });
  const nodes = NODES.map((node, index) => {
    const { x, y } = positions[index];
    const group = svgEl('g', { transform: `translate(${x} ${y})` });
    const circle = svgEl('circle', {
      r: 42,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
      'stroke-width': 1.5,
    });
    const label = svgEl('text', {
      'text-anchor': 'middle',
      dy: '0.35em',
      fill: cssColor('--text'),
      'font-size': 12,
      'font-weight': 600,
      'font-family': 'Geist, sans-serif',
    });
    label.textContent = node.label;
    group.append(circle, label);
    svg.append(group);
    return { circle, label };
  });
  const note = svgEl('text', {
    x: cx,
    y: 324,
    'text-anchor': 'middle',
    fill: cssColor('--text-muted'),
    'font-size': 12,
    'font-family': 'Geist, sans-serif',
  });
  svg.append(note);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.12);
  mountStepper(root, stage, {
    reduced,
    loop: true,
    autoMs: 2200,
    steps: NODES.map((node) => ({ label: node.label, caption: `${node.label} — ${node.note}` })),
    onStep: (active) => {
      nodes.forEach((node, index) => {
        const on = index === active;
        node.circle.setAttribute('fill', on ? accentFill : cssColor('--surface'));
        node.circle.setAttribute('stroke', on ? accent : cssColor('--border'));
        node.circle.setAttribute('stroke-width', on ? '2.5' : '1.5');
        node.label.setAttribute('fill', on ? accent : cssColor('--text'));
      });
      note.textContent = NODES[active].note;
    },
  });
}
