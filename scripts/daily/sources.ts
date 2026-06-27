// Source adapters. All keyless. Each returns RawItem[]; failures are isolated by the caller.
import { fetchJSON, fetchText, parseFeed } from '../lib/http';
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
    publishedAt: f.published,
    text: f.summary?.slice(0, 600),
  }));
}

export function fetchFeed(feed: FeedConfig, perCap: number): Promise<RawItem[]> {
  switch (feed.type) {
    case 'hn':
      return fromHN(feed, perCap);
    case 'arxiv':
      return fromArxiv(feed, perCap);
    case 'rss':
      return fromRSS(feed, perCap);
    default:
      return Promise.resolve([]);
  }
}
