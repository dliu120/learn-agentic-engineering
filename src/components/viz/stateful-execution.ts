import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const STEPS = [
  'Both lanes start with the same model call. The model itself does not remember an earlier request.',
  'The stateless lane begins the next request from supplied input only.',
  'The stateful lane saves an explicit checkpoint after the first step.',
  'After interruption, the stateful lane loads the checkpoint and resumes instead of starting over.',
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const narrow = root.clientWidth < 640;
  const W = narrow ? 300 : 760;
  const H = narrow ? 620 : 350;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'Two lanes compare stateless requests with stateful execution that saves and reloads a checkpoint.',
  );

  const lane = (x: number, title: string, labelY: number, firstY: number, secondY: number, width: number) => {
    const label = svgEl('text', {
      x,
      y: labelY,
      fill: cssColor('--text'),
      'font-size': narrow ? 15 : 14,
      'font-weight': 600,
      'font-family': 'Geist, sans-serif',
    });
    label.textContent = title;
    const first = svgEl('rect', {
      x,
      y: firstY,
      width,
      height: 64,
      rx: 4,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
    });
    const second = svgEl('rect', {
      x,
      y: secondY,
      width,
      height: 64,
      rx: 4,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
    });
    const firstText = svgEl('text', {
      x: x + width / 2,
      y: firstY + 38,
      'text-anchor': 'middle',
      fill: cssColor('--text-muted'),
      'font-size': narrow ? 13 : 12,
      'font-family': 'Geist, sans-serif',
    });
    firstText.textContent = 'Request 1 → model → result';
    const secondText = svgEl('text', {
      x: x + width / 2,
      y: secondY + 38,
      'text-anchor': 'middle',
      fill: cssColor('--text-muted'),
      'font-size': narrow ? 13 : 12,
      'font-family': 'Geist, sans-serif',
    });
    secondText.textContent = 'Request 2 → model → result';
    svg.append(label, first, second, firstText, secondText);
    return { first, second, secondText };
  };

  const stateless = narrow
    ? lane(20, 'Stateless requests', 34, 54, 190, 260)
    : lane(54, 'Stateless requests', 36, 62, 226, 280);
  const stateful = narrow
    ? lane(20, 'Stateful execution', 326, 346, 526, 260)
    : lane(426, 'Stateful execution', 36, 62, 226, 280);
  const forgotten = svgEl('text', {
    x: narrow ? 150 : 194,
    y: narrow ? 164 : 184,
    'text-anchor': 'middle',
    fill: cssColor('--text-faint'),
    'font-size': narrow ? 13 : 11,
    'font-family': 'Geist Mono, monospace',
  });
  forgotten.textContent = 'no hidden session state';
  const checkpoint = svgEl('rect', {
    x: narrow ? 80 : 496,
    y: narrow ? 442 : 148,
    width: 140,
    height: 48,
    rx: 20,
    fill: cssColor('--surface-2'),
    stroke: cssColor('--border'),
  });
  const checkpointText = svgEl('text', {
    x: narrow ? 150 : 566,
    y: narrow ? 471 : 177,
    'text-anchor': 'middle',
    fill: cssColor('--text-muted'),
    'font-size': narrow ? 13 : 11,
    'font-family': 'Geist Mono, monospace',
  });
  checkpointText.textContent = 'checkpoint store';
  const down = svgEl('line', {
    x1: narrow ? 150 : 566,
    y1: narrow ? 410 : 126,
    x2: narrow ? 150 : 566,
    y2: narrow ? 442 : 148,
    stroke: cssColor('--border'),
    'stroke-width': 2,
  });
  const resume = svgEl('line', {
    x1: narrow ? 150 : 566,
    y1: narrow ? 490 : 196,
    x2: narrow ? 150 : 566,
    y2: narrow ? 526 : 226,
    stroke: cssColor('--border'),
    'stroke-width': 2,
  });
  svg.append(forgotten, down, checkpoint, checkpointText, resume);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.12);
  mountStepper(root, stage, {
    reduced,
    loop: false,
    steps: STEPS.map((caption, index) => ({ label: `Step ${index + 1}`, caption })),
    onStep: (active) => {
      stateless.first.setAttribute('stroke', active === 0 ? accent : cssColor('--border'));
      stateful.first.setAttribute('stroke', active === 0 ? accent : cssColor('--border'));
      stateless.second.setAttribute('stroke', active >= 1 ? accent : cssColor('--border'));
      checkpoint.setAttribute('stroke', active >= 2 ? accent : cssColor('--border'));
      checkpoint.setAttribute('fill', active >= 2 ? accentFill : cssColor('--surface-2'));
      stateful.second.setAttribute('stroke', active >= 3 ? accent : cssColor('--border'));
      stateful.secondText.textContent = active >= 3 ? 'Resume from checkpoint → continue' : 'Request 2 → model → result';
      down.setAttribute('stroke', active >= 2 ? accent : cssColor('--border'));
      resume.setAttribute('stroke', active >= 3 ? accent : cssColor('--border'));
    },
  });
}
