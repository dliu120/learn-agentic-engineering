import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const STAGES = [
  { title: 'Prompt', question: 'What should this one request ask for?' },
  { title: 'Conversation', question: 'What must carry across turns?' },
  { title: 'Response', question: 'What contract must the answer satisfy?' },
  { title: 'Loop', question: 'What repeats, verifies, retries, and stops?' },
  { title: 'Graph', question: 'What branches, waits, joins, or resumes?' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const narrow = root.clientWidth < 640;
  const W = narrow ? 280 : 900;
  const H = narrow ? 620 : 280;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'Five engineering stages: prompt, conversation, response, loop, and graph engineering. Each stage adds a larger scope of control.',
  );

  const positions = STAGES.map((_, index) =>
    narrow ? { x: 140, y: 72 + index * 116 } : { x: 100 + index * 175, y: 132 },
  );

  for (let index = 0; index < positions.length - 1; index++) {
    const from = positions[index];
    const to = positions[index + 1];
    const line = narrow
      ? svgEl('line', { x1: from.x, y1: from.y + 36, x2: to.x, y2: to.y - 36 })
      : svgEl('line', { x1: from.x + 66, y1: from.y, x2: to.x - 66, y2: to.y });
    line.setAttribute('stroke', cssColor('--border'));
    line.setAttribute('stroke-width', '2');
    svg.append(line);
  }

  const nodes = STAGES.map((item, index) => {
    const { x, y } = positions[index];
    const boxX = narrow ? -100 : -66;
    const boxWidth = narrow ? 200 : 132;
    const textX = narrow ? -82 : -50;
    const group = svgEl('g', { transform: `translate(${x} ${y})` });
    const box = svgEl('rect', {
      x: boxX,
      y: -36,
      width: boxWidth,
      height: 72,
      rx: 4,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
      'stroke-width': 1.5,
    });
    const number = svgEl('text', {
      x: textX,
      y: -12,
      fill: cssColor('--text-faint'),
      'font-size': narrow ? 12 : 10,
      'font-family': 'Geist Mono, monospace',
    });
    number.textContent = `0${index + 1}`;
    const title = svgEl('text', {
      x: textX,
      y: 12,
      fill: cssColor('--text'),
      'font-size': narrow ? 15 : 14,
      'font-weight': 600,
      'font-family': 'Geist, sans-serif',
    });
    title.textContent = item.title;
    group.append(box, number, title);
    svg.append(group);
    return { box, number, title };
  });

  const note = svgEl('text', {
    x: W / 2,
    y: narrow ? H - 18 : 236,
    'text-anchor': 'middle',
    fill: cssColor('--text-muted'),
    'font-size': narrow ? 12 : 13,
    'font-family': 'Geist, sans-serif',
  });
  svg.append(note);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.12);
  mountStepper(root, stage, {
    reduced,
    loop: false,
    autoMs: 2400,
    steps: STAGES.map((item) => ({ label: item.title, caption: `${item.title} engineering — ${item.question}` })),
    onStep: (active) => {
      nodes.forEach((node, index) => {
        const reached = index <= active;
        const current = index === active;
        node.box.setAttribute('fill', current ? accentFill : cssColor('--surface'));
        node.box.setAttribute('stroke', reached ? accent : cssColor('--border'));
        node.box.setAttribute('stroke-width', current ? '2.5' : '1.5');
        node.number.setAttribute('fill', reached ? accent : cssColor('--text-faint'));
        node.title.setAttribute('fill', cssColor('--text'));
      });
      note.textContent = STAGES[active].question;
    },
  });
}
