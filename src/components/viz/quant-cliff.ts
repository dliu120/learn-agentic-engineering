// M3 — the quantization quality cliff. Big models tolerate low bits; small models fall off a
// cliff at 4-bit — and perplexity barely moves, so it hides the regression.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 280,
    L = 56,
    R = 24,
    T = 24,
    B = 48;
  const plotW = W - L - R,
    plotH = H - T - B;
  const bits = [16, 8, 4, 3, 2];
  const x = (b: number) => L + (1 - (Math.log2(b) - 1) / (4 - 1)) * plotW; // 16→left, 2→right
  const y = (a: number) => T + (1 - a) * plotH;

  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'Accuracy vs bit-width: a large model stays flat down to 4-bit, a small model collapses at 4-bit, while perplexity stays nearly flat.');

  // axes
  svg.append(svgEl('line', { x1: L, y1: T, x2: L, y2: T + plotH, stroke: cssColor('--border') }));
  svg.append(svgEl('line', { x1: L, y1: T + plotH, x2: L + plotW, y2: T + plotH, stroke: cssColor('--border') }));
  const yl = svgEl('text', { x: 8, y: T + 10, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  yl.textContent = 'acc';
  svg.append(yl);
  bits.forEach((b) => {
    const t = svgEl('text', { x: x(b), y: T + plotH + 18, 'text-anchor': 'middle', fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = `${b}b`;
    svg.append(t);
  });

  const poly = (pts: [number, number][], color: string, dash?: string) => {
    const p = svgEl('polyline', { points: pts.map(([b, a]) => `${x(b)},${y(a)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5 });
    if (dash) p.setAttribute('stroke-dasharray', dash);
    return p;
  };

  const large = poly([[16, 0.98], [8, 0.97], [4, 0.93], [3, 0.82], [2, 0.55]], cssColor('--signal-good'));
  const small = poly([[16, 0.95], [8, 0.9], [4, 0.62], [3, 0.34], [2, 0.18]], cssColor('--signal-bad'));
  const ppl = poly([[16, 0.9], [8, 0.89], [4, 0.88], [3, 0.86], [2, 0.84]], cssColor('--text-faint'), '4 4');
  const labelLarge = svgEl('text', { x: x(2) - 4, y: y(0.55) - 6, 'text-anchor': 'end', fill: cssColor('--signal-good'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  labelLarge.textContent = 'large model';
  const labelSmall = svgEl('text', { x: x(3), y: y(0.34) + 16, 'text-anchor': 'middle', fill: cssColor('--signal-bad'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  labelSmall.textContent = 'small model — cliff';
  const labelPpl = svgEl('text', { x: x(8), y: y(0.9) - 8, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  labelPpl.textContent = 'perplexity (looks fine!)';

  for (const el of [large, small, ppl, labelLarge, labelSmall, labelPpl]) {
    (el as SVGElement).style.opacity = '0';
    (el as SVGElement).style.transition = 'opacity .4s';
    svg.append(el);
  }
  stage.append(svg);
  root.append(stage);

  const show = (...els: SVGElement[]) => els.forEach((e) => (e.style.opacity = '1'));
  const hide = (...els: SVGElement[]) => els.forEach((e) => (e.style.opacity = '0'));

  const steps = [
    { caption: 'A large model degrades gracefully: near-lossless at 8-bit, still strong at 4-bit.', go: () => { show(large, labelLarge); hide(small, labelSmall, ppl, labelPpl); } },
    { caption: 'A small model falls off a cliff at 4-bit — the same bit-width, very different behavior.', go: () => { show(large, labelLarge, small, labelSmall); hide(ppl, labelPpl); } },
    { caption: 'The trap: perplexity barely moves while downstream accuracy collapses. Always run task evals, not just perplexity.', go: () => { show(large, labelLarge, small, labelSmall, ppl, labelPpl); } },
  ];

  mountStepper(root, stage, {
    steps: steps.map((s, i) => ({ label: `${i + 1}`, caption: s.caption })),
    onStep: (i) => steps[i].go(),
    reduced,
    loop: true,
    autoMs: 3000,
  });
}
