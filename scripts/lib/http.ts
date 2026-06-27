// fetch with timeout + a simple on-disk cache (so re-running the pipeline locally is fast and
// polite to upstream sources). Uses the global fetch (Node 18+).
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const UA = process.env.USER_AGENT ?? 'allm-academy-bot/1.0 (+https://allm-academy.example/about)';
const CACHE_DIR = process.env.HTTP_CACHE_DIR ?? '.cache/http';

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 24);

async function fresh(path: string, ttlMs: number): Promise<boolean> {
  try {
    const s = await stat(path);
    return Date.now() - s.mtimeMs < ttlMs;
  } catch {
    return false;
  }
}

export interface FetchOpts {
  timeoutMs?: number;
  ttlMs?: number; // cache TTL; 0 disables cache
  accept?: string;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { timeoutMs = 15000, ttlMs = 6 * 3600_000, accept } = opts;
  const cacheFile = join(CACHE_DIR, hash(url) + '.txt');
  if (ttlMs > 0 && (await fresh(cacheFile, ttlMs))) {
    return readFile(cacheFile, 'utf8');
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': UA, ...(accept ? { accept } : {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const body = await res.text();
    if (ttlMs > 0) {
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(cacheFile, body);
    }
    return body;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJSON<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  return JSON.parse(await fetchText(url, { accept: 'application/json', ...opts })) as T;
}

export async function withTimeout<T>(label: string, p: Promise<T>, ms = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => (timer = setTimeout(() => rej(new Error(`${label} timed out`)), ms)));
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// Minimal RSS/Atom parser (no dependency). Handles <item> (RSS) and <entry> (Atom).
export interface FeedItem {
  title: string;
  link: string;
  published?: string;
  summary?: string;
}

const strip = (s: string) =>
  s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (block: string, name: string): string | undefined => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? strip(m[1]) : undefined;
};

export function parseFeed(xml: string, max = 30): FeedItem[] {
  const isAtom = /<entry[\s>]/.test(xml);
  const chunks = xml.split(isAtom ? /<entry[\s>]/ : /<item[\s>]/).slice(1);
  const items: FeedItem[] = [];
  for (const raw of chunks.slice(0, max)) {
    const block = (isAtom ? '<entry ' : '<item ') + raw;
    const title = tag(block, 'title') ?? '';
    let link = '';
    if (isAtom) {
      const m = block.match(/<link[^>]*href="([^"]+)"/i);
      link = m ? m[1] : '';
    } else {
      link = tag(block, 'link') ?? '';
    }
    const published = tag(block, 'pubDate') ?? tag(block, 'published') ?? tag(block, 'updated') ?? tag(block, 'dc:date');
    const summary = tag(block, 'description') ?? tag(block, 'summary') ?? tag(block, 'content');
    if (title && link) items.push({ title, link, published, summary });
  }
  return items;
}
