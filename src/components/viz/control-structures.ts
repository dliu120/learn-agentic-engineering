import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const LEVELS = [
  { label: 'Model call', caption: 'One request produces one response. Use this when the task needs no external action or iteration.' },
  { label: 'Typed tool', caption: 'A host validates and executes one named operation for the model.' },
  { label: 'Bounded loop', caption: 'The model can choose another action, but budgets and explicit exits stay outside the model.' },
  { label: 'Workflow graph', caption: 'Nodes and edges make branches, joins, retries, waits, and ownership visible.' },
  { label: 'Multi-agent boundary', caption: 'Separate agents are optional and earn their cost through isolation, specialization, parallelism, or ownership.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const width = 360;
  const height = 320;
  const stage = document.createElement('div');
  stage.className = 'mx-auto w-full max-w-md';

  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'Five control structures from one model call through a typed tool, bounded loop, workflow graph, and optional multi-agent boundary.',
  );

  const rows = LEVELS.map((level, index) => {
    const y = 18 + index * 60;
    if (index > 0) {
      svg.append(
        svgEl('line', {
          x1: width / 2,
          y1: y - 16,
          x2: width / 2,
          y2: y,
          stroke: cssColor('--border'),
          'stroke-width': 2,
        }),
      );
    }
    const rect = svgEl('rect', {
      x: 22,
      y,
      width: width - 44,
      height: 44,
      rx: 6,
      fill: cssColor('--surface-2'),
      stroke: cssColor('--border'),
      'stroke-width': 1.5,
    });
    const number = svgEl('text', {
      x: 40,
      y: y + 27,
      fill: cssColor('--text-faint'),
      'font-size': 11,
      'font-family': 'Geist Mono, monospace',
    });
    number.textContent = String(index + 1).padStart(2, '0');
    const label = svgEl('text', {
      x: 78,
      y: y + 28,
      fill: cssColor('--text-muted'),
      'font-size': 14,
      'font-family': 'Geist, sans-serif',
      'font-weight': 600,
    });
    label.textContent = level.label;
    svg.append(rect, number, label);
    return { rect, number, label };
  });

  stage.append(svg);
  root.append(stage);

  const render = (active: number) => {
    rows.forEach((row, index) => {
      const current = index === active;
      const reached = index < active;
      row.rect.setAttribute('fill', current ? cssColor('--accent', 0.14) : cssColor('--surface-2'));
      row.rect.setAttribute('stroke', current ? cssColor('--accent') : cssColor('--border'));
      row.rect.setAttribute('stroke-width', current ? '2.5' : '1.5');
      row.number.setAttribute('fill', current || reached ? cssColor('--accent') : cssColor('--text-faint'));
      row.label.setAttribute('fill', current ? cssColor('--accent') : cssColor('--text-muted'));
    });
  };

  mountStepper(root, stage, {
    steps: LEVELS.map((level) => ({ label: level.label, caption: level.caption })),
    onStep: render,
    reduced,
    loop: false,
  });
}
