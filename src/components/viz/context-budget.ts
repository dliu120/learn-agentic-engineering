// M1 — context as a finite budget. A window bar fills with labeled segments; steps show how
// write / select / compress / isolate change what occupies the window and the "signal density".
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

type Seg = { label: string; frac: number; tone: string };

const STEPS: { caption: string; segs: Seg[]; signal: number }[] = [
  {
    caption: 'Dump everything: history + raw docs crowd the window. Signal is buried (lost-in-the-middle).',
    segs: [
      { label: 'system', frac: 0.06, tone: '--accent-2' },
      { label: 'raw history', frac: 0.46, tone: '--text-faint' },
      { label: 'raw retrieved docs', frac: 0.42, tone: '--text-faint' },
      { label: 'task', frac: 0.06, tone: '--accent' },
    ],
    signal: 0.22,
  },
  {
    caption: 'SELECT: retrieve only what the task needs. Most of the window is now reclaimed.',
    segs: [
      { label: 'system', frac: 0.06, tone: '--accent-2' },
      { label: 'history', frac: 0.2, tone: '--text-faint' },
      { label: 'selected docs', frac: 0.22, tone: '--signal-good' },
      { label: 'task', frac: 0.06, tone: '--accent' },
      { label: 'free', frac: 0.46, tone: '--surface-2' },
    ],
    signal: 0.55,
  },
  {
    caption: 'COMPRESS: summarize history; keep only salient facts. Density climbs further.',
    segs: [
      { label: 'system', frac: 0.06, tone: '--accent-2' },
      { label: 'summary', frac: 0.1, tone: '--signal-good' },
      { label: 'selected docs', frac: 0.18, tone: '--signal-good' },
      { label: 'task', frac: 0.06, tone: '--accent' },
      { label: 'free', frac: 0.6, tone: '--surface-2' },
    ],
    signal: 0.72,
  },
  {
    caption: 'ISOLATE: push side-quests to sub-agents / scratchpads. The main window stays dense and on-task.',
    segs: [
      { label: 'system', frac: 0.06, tone: '--accent-2' },
      { label: 'summary', frac: 0.08, tone: '--signal-good' },
      { label: 'just-in-time docs', frac: 0.14, tone: '--signal-good' },
      { label: 'task', frac: 0.07, tone: '--accent' },
      { label: 'free (headroom)', frac: 0.65, tone: '--surface-2' },
    ],
    signal: 0.88,
  },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 230,
    pad = 24,
    barW = W - pad * 2,
    barY = 70,
    barH = 64;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'A fixed context window filled by labeled segments; selecting, compressing and isolating reclaim space and raise signal density.');

  const title = svgEl('text', { x: pad, y: 40, fill: cssColor('--text-muted'), 'font-size': 13, 'font-family': 'JetBrains Mono, monospace' });
  title.textContent = 'context window (fixed token budget)';
  svg.append(title);

  const frame = svgEl('rect', { x: pad, y: barY, width: barW, height: barH, rx: 6, fill: 'none', stroke: cssColor('--border'), 'stroke-width': 1.5 });
  svg.append(frame);
  const segLayer = svgEl('g', {});
  svg.append(segLayer);

  // signal-density meter
  const mLabel = svgEl('text', { x: pad, y: 175, fill: cssColor('--text-faint'), 'font-size': 12, 'font-family': 'JetBrains Mono, monospace' });
  mLabel.textContent = 'signal density';
  svg.append(mLabel);
  const mTrack = svgEl('rect', { x: pad, y: 185, width: barW, height: 12, rx: 6, fill: cssColor('--surface-2') });
  const mFill = svgEl('rect', { x: pad, y: 185, width: 0, height: 12, rx: 6, fill: cssColor('--signal-good') });
  svg.append(mTrack, mFill);

  stage.append(svg);
  root.append(stage);

  const render = (i: number) => {
    segLayer.replaceChildren();
    let x = pad;
    for (const s of STEPS[i].segs) {
      const w = s.frac * barW;
      const r = svgEl('rect', { x, y: barY, width: Math.max(0, w - 1.5), height: barH, fill: cssColor(s.tone, s.tone === '--surface-2' ? 0.5 : 0.85) });
      segLayer.append(r);
      if (w > 46) {
        const t = svgEl('text', { x: x + 6, y: barY + barH / 2 + 4, fill: cssColor('--bg'), 'font-size': 10, 'font-family': 'JetBrains Mono, monospace' });
        t.textContent = s.label;
        if (s.tone === '--surface-2') t.setAttribute('fill', cssColor('--text-faint'));
        segLayer.append(t);
      }
      x += w;
    }
    mFill.setAttribute('width', String(STEPS[i].signal * barW));
  };

  mountStepper(root, stage, {
    steps: STEPS.map((s, i) => ({ label: `step ${i + 1}`, caption: s.caption })),
    onStep: render,
    reduced,
    loop: true,
    autoMs: 2600,
  });
}
