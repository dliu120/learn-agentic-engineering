// M8 — the "lethal trifecta" (Simon Willison): private data + untrusted content + an
// exfiltration channel. Any two are fine; all three together = data can be stolen.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const CIRCLES = [
  { t: 'Private data', sub: 'access to secrets / user data', tone: '--accent' },
  { t: 'Untrusted content', sub: 'attacker-controlled text in context', tone: '--accent-2' },
  { t: 'Exfiltration', sub: 'a way to send data out', tone: '--signal-warn' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 320,
    cx = W / 2,
    cy = 150,
    spread = 64,
    r = 92;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'Three overlapping circles — private data, untrusted content, and an exfiltration channel — whose common intersection is the lethal trifecta.');

  const centers = [
    { x: cx, y: cy - spread },
    { x: cx - spread, y: cy + spread * 0.7 },
    { x: cx + spread, y: cy + spread * 0.7 },
  ];

  const circles = CIRCLES.map((c, i) => {
    const el = svgEl('circle', { cx: centers[i].x, cy: centers[i].y, r, fill: cssColor(c.tone, 0.14), stroke: cssColor(c.tone), 'stroke-width': 2 });
    (el.style as CSSStyleDeclaration).transition = 'fill .3s, stroke-width .3s';
    svg.append(el);
    return el;
  });

  // labels around the outside
  const labels = CIRCLES.map((c, i) => {
    const lx = i === 0 ? cx : i === 1 ? cx - spread - r * 0.6 : cx + spread + r * 0.6;
    const ly = i === 0 ? cy - spread - r - 6 : cy + spread + r * 0.8;
    const g = svgEl('g', {});
    const t = svgEl('text', { x: lx, y: ly, 'text-anchor': 'middle', fill: cssColor(c.tone), 'font-size': 12, 'font-weight': 600, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = c.t;
    const s = svgEl('text', { x: lx, y: ly + 15, 'text-anchor': 'middle', fill: cssColor('--text-faint'), 'font-size': 10 });
    s.textContent = c.sub;
    g.append(t, s);
    svg.append(g);
    return g;
  });

  const danger = svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', fill: cssColor('--signal-bad'), 'font-size': 13, 'font-weight': 700, 'font-family': 'JetBrains Mono, monospace' });
  danger.style.opacity = '0';
  (danger.style as CSSStyleDeclaration).transition = 'opacity .4s';
  danger.textContent = '☠ lethal';
  svg.append(danger);

  stage.append(svg);
  root.append(stage);

  const steps = [
    { caption: 'Private data alone — your app can read secrets. Safe by itself.', hot: [0] },
    { caption: 'Add untrusted content (a web page, an email, a PDF the model ingests). Still safe alone.', hot: [0, 1] },
    { caption: 'Add an exfiltration channel (a tool that makes requests, renders links/images). Each pair is survivable…', hot: [0, 1, 2] },
    { caption: 'All three at once = the lethal trifecta: injected instructions can read secrets and send them out. Break at least one leg.', hot: [0, 1, 2], danger: true },
  ];

  const render = (i: number) => {
    const s = steps[i];
    circles.forEach((c, j) => {
      const on = s.hot.includes(j);
      c.setAttribute('fill', cssColor(CIRCLES[j].tone, on ? 0.28 : 0.06));
      c.setAttribute('stroke-width', on ? '3' : '1');
    });
    labels.forEach((l, j) => (l.style.opacity = s.hot.includes(j) ? '1' : '0.4'));
    danger.style.opacity = s.danger ? '1' : '0';
  };

  mountStepper(root, stage, {
    steps: steps.map((s, i) => ({ label: `${i + 1}`, caption: s.caption })),
    onStep: render,
    reduced,
    loop: true,
    autoMs: 2800,
  });
}
