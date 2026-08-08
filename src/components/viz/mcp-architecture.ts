import { cssColor, svgEl } from '@/lib/motion';
import { mountStepper } from './stepper';

const STEPS = [
  'The model can request a capability, but it does not connect to external systems directly.',
  'The host owns the conversation, consent, and the context shown to the model.',
  'The host creates one MCP client for each server connection.',
  'Servers expose tools, resources, and prompts through a standard protocol.',
  'A request flows Model → Host → Client → Server, then the result returns through the same boundary.',
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 760;
  const H = 360;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'MCP architecture: a model inside a host, three MCP clients inside the host, and three external servers connected one-to-one.',
  );

  const host = svgEl('rect', {
    x: 50,
    y: 34,
    width: 400,
    height: 292,
    rx: 8,
    fill: cssColor('--surface'),
    stroke: cssColor('--border'),
    'stroke-width': 2,
  });
  const hostLabel = svgEl('text', {
    x: 70,
    y: 64,
    fill: cssColor('--text-faint'),
    'font-size': 11,
    'font-family': 'Geist Mono, monospace',
  });
  hostLabel.textContent = 'HOST APPLICATION';
  const model = svgEl('rect', {
    x: 130,
    y: 86,
    width: 240,
    height: 58,
    rx: 4,
    fill: cssColor('--surface-2'),
    stroke: cssColor('--border'),
  });
  const modelLabel = svgEl('text', {
    x: 250,
    y: 120,
    'text-anchor': 'middle',
    fill: cssColor('--text'),
    'font-size': 15,
    'font-weight': 600,
    'font-family': 'Geist, sans-serif',
  });
  modelLabel.textContent = 'Language model';
  svg.append(host, hostLabel, model, modelLabel);

  const clientRows = [
    { y: 184, label: 'Client A', server: 'Filesystem server' },
    { y: 238, label: 'Client B', server: 'Issue tracker server' },
    { y: 292, label: 'Client C', server: 'Database server' },
  ];
  const clients = clientRows.map((row) => {
    const client = svgEl('rect', {
      x: 90,
      y: row.y - 18,
      width: 120,
      height: 36,
      rx: 4,
      fill: cssColor('--surface-2'),
      stroke: cssColor('--border'),
    });
    const clientLabel = svgEl('text', {
      x: 150,
      y: row.y + 4,
      'text-anchor': 'middle',
      fill: cssColor('--text-muted'),
      'font-size': 12,
      'font-family': 'Geist, sans-serif',
    });
    clientLabel.textContent = row.label;
    const server = svgEl('rect', {
      x: 520,
      y: row.y - 22,
      width: 190,
      height: 44,
      rx: 4,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
    });
    const serverLabel = svgEl('text', {
      x: 615,
      y: row.y + 4,
      'text-anchor': 'middle',
      fill: cssColor('--text'),
      'font-size': 12,
      'font-family': 'Geist, sans-serif',
    });
    serverLabel.textContent = row.server;
    const line = svgEl('line', {
      x1: 210,
      y1: row.y,
      x2: 520,
      y2: row.y,
      stroke: cssColor('--border'),
      'stroke-width': 2,
    });
    svg.append(line, client, clientLabel, server, serverLabel);
    return { client, clientLabel, server, serverLabel, line };
  });

  const packet = svgEl('circle', { cx: 250, cy: 115, r: 7, fill: cssColor('--accent') });
  svg.append(packet);
  stage.append(svg);
  root.append(stage);

  const accent = cssColor('--accent');
  const accentFill = cssColor('--accent', 0.12);
  mountStepper(root, stage, {
    reduced,
    loop: false,
    steps: STEPS.map((caption, index) => ({ label: `Step ${index + 1}`, caption })),
    onStep: (active) => {
      host.setAttribute('stroke', active >= 1 ? accent : cssColor('--border'));
      model.setAttribute('stroke', active === 0 ? accent : cssColor('--border'));
      clients.forEach((row) => {
        row.client.setAttribute('stroke', active >= 2 ? accent : cssColor('--border'));
        row.client.setAttribute('fill', active >= 2 ? accentFill : cssColor('--surface-2'));
        row.server.setAttribute('stroke', active >= 3 ? accent : cssColor('--border'));
        row.line.setAttribute('stroke', active >= 3 ? accent : cssColor('--border'));
      });
      const route = [
        { x: 250, y: 115 },
        { x: 250, y: 115 },
        { x: 150, y: 184 },
        { x: 365, y: 184 },
        { x: 615, y: 184 },
      ][active];
      packet.setAttribute('cx', String(route.x));
      packet.setAttribute('cy', String(route.y));
    },
  });
}
