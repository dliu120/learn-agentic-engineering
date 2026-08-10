import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DailyLessonCard from '../src/components/ui/DailyLessonCard.astro';
import type { DailyLesson } from '../src/content/schemas/daily';

const lesson: DailyLesson = {
  id: 'prime-agent',
  headline: 'PrimeIntellect-ai/prime-agent',
  sourceLinks: [{
    title: 'PrimeIntellect-ai/prime-agent',
    url: 'https://github.com/PrimeIntellect-ai/prime-agent',
    source: 'GitHub · recently active',
    type: 'repository',
    publishedAt: '2026-08-09T12:00:00Z',
  }],
  summaryBullets: ['A repository surfaced by the daily scan.', 'Popularity is a discovery signal, not validation.'],
  whyItMatters: 'It is an inspectable agent harness.',
  module: 'agent-control-routing-degradation',
  secondaryModules: [],
  moduleRationale: 'Matched agent harness.',
  tags: ['agent harness'],
  meta: { difficulty: 'intermediate', readingTimeMin: 2, signals: { stars: 12594, forks: 1266 } },
};

describe('DailyLessonCard', () => {
  it('renders discoverable source type, provenance link, and labeled repository signals', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(DailyLessonCard, { props: { lesson, index: 1 } });
    expect(html).toContain('repository');
    expect(html).toContain('https://github.com/PrimeIntellect-ai/prime-agent');
    expect(html).toContain('GitHub · recently active');
    expect(html).toContain('active Aug 9');
    expect(html).toContain('Discovery signals');
    expect(html).toContain('GitHub stars');
    expect(html).toContain('12,594');
  });
});
