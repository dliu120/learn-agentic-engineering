import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const STEPS = [
  { active: ['plan'], caption: 'Plan runs first because it has no unmet dependency.' },
  { active: ['research', 'draft'], caption: 'Research and Draft have no dependency on each other, so they can run in parallel.' },
  { active: ['review'], caption: 'Review waits for both parallel branches to finish, then joins their results.' },
  { active: ['publish'], caption: 'Publish runs only after Review accepts the combined result.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const narrow = root.clientWidth < 640;
  const W = narrow ? 280 : 640;
  const H = narrow ? 560 : 380;
  const nodesData = narrow
    ? [
        { id: 'plan', label: 'Plan', x: 140, y: 48 },
        { id: 'research', label: 'Research', x: 75, y: 170 },
        { id: 'draft', label: 'Draft', x: 205, y: 170 },
        { id: 'review', label: 'Review', x: 140, y: 330 },
        { id: 'publish', label: 'Publish', x: 140, y: 470 },
      ]
    : [
        { id: 'plan', label: 'Plan', x: 320, y: 48 },
        { id: 'research', label: 'Research', x: 190, y: 142 },
        { id: 'draft', label: 'Draft', x: 450, y: 142 },
        { id: 'review', label: 'Review', x: 320, y: 236 },
        { id: 'publish', label: 'Publish', x: 320, y: 326 },
      ];
  const halfWidth = narrow ? 62 : 64;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'A workflow graph where Plan fans out to Research and Draft in parallel, both join at Review, then Publish runs.',
  );

  const nodeById = Object.fromEntries(nodesData.map((node) => [node.id, node]));
  const edges: [string, string][] = [
    ['plan', 'research'],
    ['plan', 'draft'],
    ['research', 'review'],
    ['draft', 'review'],
    ['review', 'publish'],
  ];
  edges.forEach(([fromId, toId]) => {
    const from = nodeById[fromId];
    const to = nodeById[toId];
    const line = svgEl('line', {
      x1: from.x,
      y1: from.y + 26,
      x2: to.x,
      y2: to.y - 26,
      stroke: cssColor('--text-faint'),
      'stroke-width': 2,
    });
    svg.append(line);
  });

  const nodes = Object.fromEntries(
    nodesData.map((node) => {
      const group = svgEl('g', { transform: `translate(${node.x} ${node.y})` });
      const box = svgEl('rect', {
        x: -halfWidth,
        y: -26,
        width: halfWidth * 2,
        height: 52,
        rx: 4,
        fill: cssColor('--surface'),
        stroke: cssColor('--border'),
        'stroke-width': 1.5,
      });
      const label = svgEl('text', {
        'text-anchor': 'middle',
        dy: '0.35em',
        fill: cssColor('--text'),
        'font-size': narrow ? 14 : 13,
        'font-weight': 600,
        'font-family': 'Geist, sans-serif',
      });
      label.textContent = node.label;
      group.append(box, label);
      svg.append(group);
      return [node.id, { box, label }];
    }),
  );

  const state = svgEl('text', {
    x: narrow ? 260 : 560,
    y: narrow ? 540 : 350,
    'text-anchor': 'end',
    fill: cssColor('--text-faint'),
    'font-size': narrow ? 12 : 11,
    'font-family': 'Geist Mono, monospace',
  });
  state.textContent = 'shared typed state';
  svg.append(state);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.12);
  mountStepper(root, stage, {
    reduced,
    loop: false,
    steps: STEPS.map((step, index) => ({ label: `Step ${index + 1}`, caption: step.caption })),
    onStep: (active) => {
      const activeIds = new Set(STEPS[active].active);
      Object.entries(nodes).forEach(([id, node]) => {
        const on = activeIds.has(id);
        node.box.setAttribute('fill', on ? accentFill : cssColor('--surface'));
        node.box.setAttribute('stroke', on ? accent : cssColor('--border'));
        node.box.setAttribute('stroke-width', on ? '2.5' : '1.5');
        node.label.setAttribute('fill', cssColor('--text'));
      });
    },
  });
}
