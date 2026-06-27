export interface RawItem {
  title: string;
  url: string;
  source: string;
  publishedAt?: string; // ISO
  text?: string;
  signals?: { points?: number; comments?: number };
}

export interface FeedConfig {
  name: string;
  type: 'hn' | 'arxiv' | 'rss';
  url?: string;
  query?: string;
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
