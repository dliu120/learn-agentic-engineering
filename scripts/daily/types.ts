export interface RawItem {
  title: string;
  url: string;
  source: string;
  publishedAt?: string; // ISO
  text?: string;
  sourceType?: 'paper' | 'repository' | 'discussion' | 'article';
  signals?: { points?: number; comments?: number; stars?: number; forks?: number };
}

export interface FeedConfig {
  name: string;
  type: 'hn' | 'arxiv' | 'rss' | 'github';
  url?: string;
  query?: string;
  queries?: string[];
  weight: number;
}

export interface SourcesConfig {
  window_hours: number;
  candidate_cap: number;
  per_source_cap: number;
  min_relevance: number;
  recency_half_life_hours: number;
  max_lessons: number;
  model: string;
  voice: string;
  allowlist: string[];
  feeds: FeedConfig[];
}
