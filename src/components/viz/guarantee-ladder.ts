// M4 — the structured-output guarantee ladder. Each rung raises reliability from "hope" to
// "guaranteed valid + semantically checked".
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const RUNGS = [
  { t: 'Prompt & pray', d: 'Ask for JSON in the prompt. Syntactically wrong often.', rel: 0.45 },
  { t: 'JSON mode', d: 'Provider guarantees valid JSON syntax — but not your shape.', rel: 0.62 },
  { t: 'Schema validation', d: 'Validate against a schema after generation; reject/repair on miss.', rel: 0.78 },
  { t: 'Constrained decoding', d: 'A grammar/FSM masks tokens so only schema-valid output can be emitted.', rel: 0.9 },
  { t: 'Repair + fallback chain', d: 'On failure: feed the error back to repair (bounded), then fall back.', rel: 0.97 },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 300,
    L = 30,
    rungH = 44,
    top = 24,
    meterX = W - 70;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'A ladder from prompt-and-pray up to constrained decoding plus a repair-and-fallback chain, with reliability rising at each rung.');

  const rungEls = RUNGS.map((r, i) => {
    const y = top + (RUNGS.length - 1 - i) * (rungH + 8); // bottom = rung 0
    const g = svgEl('g', {});
    const box = svgEl('rect', { x: L, y, width: meterX - L - 24, height: rungH, rx: 6, fill: cssColor('--surface-2'), stroke: cssColor('--border'), 'stroke-width': 1.5 });
    const t = svgEl('text', { x: L + 12, y: y + 18, fill: cssColor('--text'), 'font-size': 13, 'font-weight': 600, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = `${i + 1}. ${r.t}`;
    const d = svgEl('text', { x: L + 12, y: y + 35, fill: cssColor('--text-muted'), 'font-size': 11 });
    d.textContent = r.d;
    (box.style as CSSStyleDeclaration).transition = 'stroke .3s, fill .3s';
    g.append(box, t, d);
    svg.append(g);
    return { box, t };
  });

  // reliability meter
  const mTop = top,
    mH = (rungH + 8) * RUNGS.length - 8,
    mW = 26;
  svg.append(svgEl('rect', { x: meterX, y: mTop, width: mW, height: mH, rx: 6, fill: cssColor('--surface-2') }));
  const mFill = svgEl('rect', { x: meterX, y: mTop + mH, width: mW, height: 0, rx: 6, fill: cssColor('--signal-good') });
  (mFill.style as CSSStyleDeclaration).transition = 'height .6s ease, y .6s ease';
  svg.append(mFill);
  const mLabel = svgEl('text', { x: meterX + mW / 2, y: mTop + mH + 16, 'text-anchor': 'middle', fill: cssColor('--text-faint'), 'font-size': 10, 'font-family': 'JetBrains Mono, monospace' });
  mLabel.textContent = 'reliab.';
  svg.append(mLabel);

  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const setLevel = (idx: number) => {
    rungEls.forEach((re, j) => {
      const on = j <= idx;
      re.box.setAttribute('stroke', j === idx ? accent : on ? cssColor('--signal-good', 0.6) : cssColor('--border'));
      re.box.setAttribute('fill', j === idx ? cssColor('--accent', 0.12) : cssColor('--surface-2'));
    });
    const rel = RUNGS[idx].rel;
    mFill.setAttribute('height', String(rel * mH));
    mFill.setAttribute('y', String(mTop + mH - rel * mH));
  };

  mountStepper(root, stage, {
    steps: RUNGS.map((r, i) => ({ label: `${i + 1}`, caption: `${r.t} — ${r.d} (reliability ≈ ${Math.round(r.rel * 100)}%)` })),
    onStep: setLevel,
    reduced,
    loop: true,
    autoMs: 2600,
  });
}
