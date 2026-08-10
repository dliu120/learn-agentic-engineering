// Source adapters. All keyless. Each returns RawItem[]; failures are isolated by the caller.
import { fetchJSON, fetchText, parseFeed } from '../lib/http';
import { log } from '../lib/log';
import type { FeedConfig, RawItem } from './types';

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  created_at?: string;
  points?: number;
  num_comments?: number;
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description?: string | null;
  pushed_at?: string;
  stargazers_count?: number;
  forks_count?: number;
  archived?: boolean;
  fork?: boolean;
}

interface GitHubSearchResponse {
  incomplete_results?: boolean;
  items?: unknown[];
}

const isGitHubRepo = (value: unknown): value is GitHubRepo => {
  if (!value || typeof value !== 'object') return false;
  const repo = value as Record<string, unknown>;
  if (typeof repo.full_name !== 'string' || typeof repo.html_url !== 'string' || typeof repo.pushed_at !== 'string') return false;
  if (!Number.isFinite(Date.parse(repo.pushed_at))) return false;
  try {
    const url = new URL(repo.html_url);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.replace(/\/$/, '').toLowerCase() === `/${repo.full_name}`.toLowerCase();
  } catch {
    return false;
  }
};

const nonnegativeNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

async function fromHN(feed: FeedConfig, perCap: number): Promise<RawItem[]> {
  const q = encodeURIComponent(feed.query ?? 'LLM');
  const data = await fetchJSON<{ hits: AlgoliaHit[] }>(
    `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=story&hitsPerPage=${perCap * 2}`,
    { ttlMs: 3 * 3600_000 },
  );
  return data.hits
    .map((h) => ({
      title: h.title ?? h.story_title ?? '',
      url: h.url ?? h.story_url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: feed.name,
      sourceType: 'discussion' as const,
      publishedAt: h.created_at,
      signals: { points: h.points ?? 0, comments: h.num_comments ?? 0 },
    }))
    .filter((i) => i.title);
}

async function fromArxiv(feed: FeedConfig, perCap: number): Promise<RawItem[]> {
  const q = encodeURIComponent(feed.query ?? 'cat:cs.CL');
  const xml = await fetchText(
    `https://export.arxiv.org/api/query?search_query=${q}&sortBy=submittedDate&sortOrder=descending&max_results=${perCap * 2}`,
    { ttlMs: 6 * 3600_000 },
  );
  return parseFeed(xml, perCap * 2).map((f) => ({
    title: f.title.replace(/\s+/g, ' '),
    url: f.link,
    source: feed.name,
    sourceType: 'paper',
    publishedAt: f.published,
    text: f.summary?.slice(0, 600),
  }));
}

async function fromRSS(feed: FeedConfig, perCap: number): Promise<RawItem[]> {
  if (!feed.url) return [];
  const xml = await fetchText(feed.url, { ttlMs: 6 * 3600_000, accept: 'application/rss+xml, application/atom+xml, application/xml' });
  return parseFeed(xml, perCap * 2).map((f) => ({
    title: f.title,
    url: f.link,
    source: feed.name,
    sourceType: 'article',
    publishedAt: f.published,
    text: f.summary?.slice(0, 600),
  }));
}

const githubSince = (windowHours: number, now = Date.now()): string =>
  new Date(now - windowHours * 3600_000).toISOString().slice(0, 10);

export function githubSearchUrl(query: string, perQuery: number, windowHours: number, now = Date.now()): string {
  const qualified = `${query} in:name,description,topics pushed:>=${githubSince(windowHours, now)} archived:false fork:false`;
  const params = new URLSearchParams({
    q: qualified,
    sort: 'stars',
    order: 'desc',
    per_page: String(Math.max(1, Math.min(Math.floor(perQuery), 10))),
  });
  return `https://api.github.com/search/repositories?${params}`;
}

// GitHub has no official "trending" API. Use a small, explicit query set and expose only
// current popularity plus recent-push signals; neither is presented as proof of quality.
async function fromGitHub(feed: FeedConfig, perCap: number, windowHours: number): Promise<RawItem[]> {
  const configuredQueries = feed.queries?.map((query) => query.trim()).filter(Boolean) ?? [];
  const queries = (configuredQueries.length ? configuredQueries : [feed.query?.trim() || 'agent harness']).slice(0, 4);
  const resultCap = Math.min(perCap, queries.length);
  const perQuery = Math.max(2, Math.ceil(resultCap / queries.length) * 2);
  const settled = await Promise.allSettled(
    queries.map((query) => fetchJSON<GitHubSearchResponse>(githubSearchUrl(query, perQuery, windowHours), { ttlMs: 6 * 3600_000 })),
  );
  const buckets = settled.map((result, index) => {
    if (result.status === 'rejected') {
      log.warn(`GitHub query "${queries[index]}" failed: ${String(result.reason)}`);
      return [];
    }
    if (result.value.incomplete_results) log.warn(`GitHub query "${queries[index]}" returned incomplete results`);
    return (result.value.items ?? []).filter(isGitHubRepo);
  });
  const out: RawItem[] = [];
  const seen = new Set<string>();
  for (const bucket of buckets) {
    const repo = bucket.find((candidate) => !candidate.archived && !candidate.fork && !seen.has(candidate.html_url));
    if (!repo) continue;
    seen.add(repo.html_url);
    out.push({
      title: repo.full_name,
      url: repo.html_url,
      source: feed.name,
      sourceType: 'repository',
      publishedAt: repo.pushed_at,
      text: typeof repo.description === 'string' ? repo.description.slice(0, 600) : undefined,
      signals: { stars: nonnegativeNumber(repo.stargazers_count), forks: nonnegativeNumber(repo.forks_count) },
    });
    if (out.length >= resultCap) break;
  }
  return out;
}

export function fetchFeed(feed: FeedConfig, perCap: number, windowHours = 48): Promise<RawItem[]> {
  switch (feed.type) {
    case 'hn':
      return fromHN(feed, perCap);
    case 'arxiv':
      return fromArxiv(feed, perCap);
    case 'rss':
      return fromRSS(feed, perCap);
    case 'github':
      return fromGitHub(feed, perCap, windowHours);
    default:
      return Promise.resolve([]);
  }
}
