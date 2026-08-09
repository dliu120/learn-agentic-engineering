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
  const narrow = root.clientWidth < 640;
  const W = narrow ? 280 : 760;
  const H = narrow ? 430 : 360;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute(
    'aria-label',
    'MCP architecture: a model inside a host, three MCP clients inside the host, and three external servers connected one-to-one.',
  );

  const host = svgEl('rect', {
    x: narrow ? 10 : 50,
    y: narrow ? 24 : 34,
    width: narrow ? 125 : 400,
    height: narrow ? 382 : 292,
    rx: 8,
    fill: cssColor('--surface'),
    stroke: cssColor('--text-faint'),
    'stroke-width': 2,
  });
  const hostLabel = svgEl('text', {
    x: narrow ? 20 : 70,
    y: narrow ? 46 : 64,
    fill: cssColor('--text-faint'),
    'font-size': narrow ? 12 : 11,
    'font-family': 'Geist Mono, monospace',
  });
  hostLabel.textContent = 'HOST APPLICATION';
  const model = svgEl('rect', {
    x: narrow ? 24 : 130,
    y: narrow ? 64 : 86,
    width: narrow ? 96 : 240,
    height: narrow ? 52 : 58,
    rx: 4,
    fill: cssColor('--surface-2'),
    stroke: cssColor('--border'),
  });
  const modelLabel = svgEl('text', {
    x: narrow ? 72 : 250,
    y: narrow ? 95 : 120,
    'text-anchor': 'middle',
    fill: cssColor('--text'),
    'font-size': narrow ? 12 : 15,
    'font-weight': 600,
    'font-family': 'Geist, sans-serif',
  });
  modelLabel.textContent = 'Language model';
  svg.append(host, hostLabel, model, modelLabel);

  const clientRows = [
    { y: narrow ? 180 : 184, label: 'Client A', server: narrow ? 'Files' : 'Filesystem server' },
    { y: narrow ? 260 : 238, label: 'Client B', server: narrow ? 'Issues' : 'Issue tracker server' },
    { y: narrow ? 340 : 292, label: 'Client C', server: narrow ? 'Database' : 'Database server' },
  ];
  const clients = clientRows.map((row) => {
    const client = svgEl('rect', {
      x: narrow ? 20 : 90,
      y: row.y - 18,
      width: narrow ? 105 : 120,
      height: 36,
      rx: 4,
      fill: cssColor('--surface-2'),
      stroke: cssColor('--border'),
    });
    const clientLabel = svgEl('text', {
      x: narrow ? 72 : 150,
      y: row.y + 4,
      'text-anchor': 'middle',
      fill: cssColor('--text-muted'),
      'font-size': narrow ? 12 : 12,
      'font-family': 'Geist, sans-serif',
    });
    clientLabel.textContent = row.label;
    const server = svgEl('rect', {
      x: narrow ? 155 : 520,
      y: row.y - 22,
      width: narrow ? 115 : 190,
      height: 44,
      rx: 4,
      fill: cssColor('--surface'),
      stroke: cssColor('--border'),
    });
    const serverLabel = svgEl('text', {
      x: narrow ? 212 : 615,
      y: row.y + 4,
      'text-anchor': 'middle',
      fill: cssColor('--text'),
      'font-size': narrow ? 12 : 12,
      'font-family': 'Geist, sans-serif',
    });
    serverLabel.textContent = row.server;
    const line = svgEl('line', {
      x1: narrow ? 125 : 210,
      y1: row.y,
      x2: narrow ? 155 : 520,
      y2: row.y,
      stroke: cssColor('--border'),
      'stroke-width': 2,
    });
    svg.append(line, client, clientLabel, server, serverLabel);
    return { client, clientLabel, server, serverLabel, line };
  });

  const packet = svgEl('circle', {
    cx: narrow ? 72 : 250,
    cy: narrow ? 90 : 115,
    r: 7,
    fill: cssColor('--accent'),
  });
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
        row.line.setAttribute('stroke', active >= 3 ? accent : cssColor('--text-faint'));
      });
      const route = [
        { x: narrow ? 72 : 250, y: narrow ? 90 : 115 },
        { x: narrow ? 72 : 250, y: narrow ? 90 : 115 },
        { x: narrow ? 72 : 150, y: narrow ? 180 : 184 },
        { x: narrow ? 140 : 365, y: narrow ? 180 : 184 },
        { x: narrow ? 212 : 615, y: narrow ? 180 : 184 },
      ][active];
      packet.setAttribute('cx', String(route.x));
      packet.setAttribute('cy', String(route.y));
    },
  });
}
