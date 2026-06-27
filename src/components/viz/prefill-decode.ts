// M2 — prefill vs decode. Two phases, two bottlenecks: prefill saturates compute (sets TTFT);
// decode saturates memory bandwidth at low-to-moderate batch (sets TPOT).
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 260;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'Prefill processes all input tokens in one compute-bound pass setting TTFT; decode emits one token per step, bandwidth-bound, setting per-token latency.');

  // token strip
  const cols = 16;
  const tw = 26,
    gap = 4,
    stripX = 24,
    stripY = 36;
  const toks: SVGRectElement[] = [];
  for (let i = 0; i < cols; i++) {
    const r = svgEl('rect', { x: stripX + i * (tw + gap), y: stripY, width: tw, height: 22, rx: 3, fill: cssColor('--surface-2'), stroke: cssColor('--border') });
    (r.style as CSSStyleDeclaration).transition = 'fill .25s';
    svg.append(r);
    toks.push(r);
  }
  const stripLabel = svgEl('text', { x: stripX, y: 26, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(stripLabel);

  // meters
  const meter = (x: number, label: string) => {
    const baseY = 220,
      h = 120,
      w = 60;
    const track = svgEl('rect', { x, y: baseY - h, width: w, height: h, rx: 4, fill: cssColor('--surface-2') });
    const fill = svgEl('rect', { x, y: baseY, width: w, height: 0, rx: 4, fill: cssColor('--accent') });
    (fill.style as CSSStyleDeclaration).transition = 'height .6s ease, y .6s ease';
    const cap = svgEl('text', { x: x + w / 2, y: baseY + 16, 'text-anchor': 'middle', fill: cssColor('--text-muted'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    cap.textContent = label;
    svg.append(track, fill, cap);
    const baseYConst = baseY;
    return (frac: number, color: string) => {
      const hh = frac * h;
      fill.setAttribute('height', String(hh));
      fill.setAttribute('y', String(baseYConst - hh));
      fill.setAttribute('fill', color);
    };
  };
  const compute = meter(440, 'compute');
  const bandwidth = meter(520, 'bandwidth');

  const phaseText = svgEl('text', { x: 24, y: 200, fill: cssColor('--text'), 'font-size': 13, 'font-weight': 600, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(phaseText);
  const metric = svgEl('text', { x: 24, y: 220, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(metric);

  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const warn = cssColor('--signal-warn');

  const steps = [
    {
      label: 'prefill',
      caption: 'PREFILL: the whole prompt is processed in one parallel pass. Arithmetic-heavy → compute-bound. This sets TTFT (time to first token).',
      apply() {
        stripLabel.textContent = 'input tokens — processed in parallel';
        toks.forEach((t) => t.setAttribute('fill', accent));
        compute(0.95, accent);
        bandwidth(0.25, cssColor('--text-faint'));
        phaseText.textContent = 'Phase: PREFILL';
        metric.textContent = 'bottleneck: COMPUTE · sets TTFT';
      },
    },
    {
      label: 'decode',
      caption: 'DECODE: one token per step, re-reading weights + KV from HBM for a single token (low arithmetic intensity) → bandwidth-bound at low-to-moderate batch. This sets per-token latency (TPOT).',
      apply() {
        stripLabel.textContent = 'output tokens — emitted one per step';
        toks.forEach((t, i) => t.setAttribute('fill', i < 6 ? warn : cssColor('--surface-2')));
        compute(0.22, cssColor('--text-faint'));
        bandwidth(0.95, warn);
        phaseText.textContent = 'Phase: DECODE';
        metric.textContent = 'bottleneck: BANDWIDTH · sets TPOT/ITL';
      },
    },
  ];

  mountStepper(root, stage, {
    steps: steps.map((s) => ({ label: s.label, caption: s.caption })),
    onStep: (i) => steps[i].apply(),
    reduced,
    loop: true,
    autoMs: 3200,
  });
}
