import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../scripts/lib/http', () => ({
  fetchJSON: vi.fn(),
  fetchText: vi.fn(),
  parseFeed: vi.fn(),
}));

import { fetchJSON } from '../scripts/lib/http';
import { fetchFeed, githubSearchUrl } from '../scripts/daily/sources';
import type { FeedConfig } from '../scripts/daily/types';

const feed: FeedConfig = {
  name: 'GitHub · recently active',
  type: 'github',
  weight: 0.85,
  queries: ['repo:microsoft/graphrag', '"agent memory"', '"agent harness"', 'repo:PrimeIntellect-ai/prime-agent'],
};

const repo = (full_name: string, stars: number) => ({
  full_name,
  html_url: `https://github.com/${full_name}`,
  description: `${full_name} description`,
  pushed_at: '2026-08-09T12:00:00Z',
  stargazers_count: stars,
  forks_count: Math.floor(stars / 10),
  archived: false,
  fork: false,
});

describe('GitHub source adapter', () => {
  beforeEach(() => vi.mocked(fetchJSON).mockReset());

  it('builds a bounded recent-push query without credentials', () => {
    const url = new URL(githubSearchUrl('graphrag', 4, 48, Date.parse('2026-08-10T18:00:00Z')));
    expect(url.origin + url.pathname).toBe('https://api.github.com/search/repositories');
    expect(url.searchParams.get('q')).toContain('graphrag in:name,description,topics');
    expect(url.searchParams.get('q')).toContain('pushed:>=2026-08-08');
    expect(url.searchParams.get('q')).toContain('archived:false fork:false');
    expect(url.searchParams.get('sort')).toBe('stars');
    expect(url.searchParams.get('per_page')).toBe('4');
    expect(new URL(githubSearchUrl('graphrag', 100, 48)).searchParams.get('per_page')).toBe('10');
  });

  it('keeps one result per topic, exact provenance, and query-level failure isolation', async () => {
    vi.mocked(fetchJSON)
      .mockResolvedValueOnce({ items: [repo('microsoft/graphrag', 100), repo('other/graphrag', 99)] })
      .mockRejectedValueOnce(new Error('one query failed'))
      .mockResolvedValueOnce({ items: [repo('langchain-ai/deepagents', 80)] })
      .mockResolvedValueOnce({ items: [repo('PrimeIntellect-ai/prime-agent', 60)] });

    const items = await fetchFeed(feed, 8, 48);
    expect(items.map((item) => item.title)).toEqual([
      'microsoft/graphrag',
      'langchain-ai/deepagents',
      'PrimeIntellect-ai/prime-agent',
    ]);
    expect(items[2]).toMatchObject({
      url: 'https://github.com/PrimeIntellect-ai/prime-agent',
      sourceType: 'repository',
      signals: { stars: 60, forks: 6 },
    });
    expect(items.some((item) => item.title === 'other/graphrag')).toBe(false);
  });

  it('drops archived repositories, forks, and duplicates', async () => {
    const duplicate = repo('microsoft/graphrag', 100);
    vi.mocked(fetchJSON)
      .mockResolvedValueOnce({ items: [duplicate] })
      .mockResolvedValueOnce({ items: [{ ...repo('old/archive', 90), archived: true }, duplicate] })
      .mockResolvedValueOnce({ items: [{ ...repo('fork/repo', 80), fork: true }] })
      .mockResolvedValueOnce({ items: [] });

    const items = await fetchFeed(feed, 8, 48);
    expect(items.map((item) => item.title)).toEqual(['microsoft/graphrag']);
  });

  it('drops malformed records that cannot preserve canonical, time-bounded provenance', async () => {
    vi.mocked(fetchJSON)
      .mockResolvedValueOnce({ items: [repo('microsoft/graphrag', 100), { ...repo('missing/time', 20), pushed_at: undefined }] })
      .mockResolvedValueOnce({ items: [{ ...repo('wrong/host', 20), html_url: 'https://example.com/wrong/host' }] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] });

    const items = await fetchFeed(feed, 8, 48);
    expect(items.map((item) => item.title)).toEqual(['microsoft/graphrag']);
  });

  it('returns remaining buckets when GitHub rate-limits one query', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(fetchJSON)
      .mockRejectedValueOnce(new Error('HTTP 403 rate limit exceeded'))
      .mockResolvedValueOnce({ items: [repo('mem0ai/mem0', 90)] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [repo('PrimeIntellect-ai/prime-agent', 60)] });

    await expect(fetchFeed(feed, 8, 48)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'mem0ai/mem0' }),
      expect.objectContaining({ title: 'PrimeIntellect-ai/prime-agent' }),
    ]));
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('⚠'),
      expect.stringContaining('HTTP 403 rate limit exceeded'),
    );
    warning.mockRestore();
  });
});
