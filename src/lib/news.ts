import type { NewsArticle } from '@/types';
import { MOCK_NEWS } from './mock-data';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const hasNewsApiKey = !!NEWS_API_KEY;

interface NewsApiArticle {
  title: string;
  url: string;
  publishedAt: string;
  source: { name: string };
  description: string | null;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  articles: NewsApiArticle[];
}

const SUPPLY_CHAIN_QUERIES = [
  'supply chain disruption',
  'semiconductor shortage',
  'rare earth minerals export',
  'Taiwan Strait shipping',
  'China trade restrictions electronics',
  'port congestion logistics',
];

export async function fetchNewsArticles(): Promise<{
  articles: Omit<NewsArticle, 'id' | 'classifiedCategory' | 'affectedGeography' | 'affectedCompany' | 'severity' | 'processed' | 'createdAt'>[];
  usedMockData: boolean;
}> {
  if (!hasNewsApiKey) {
    console.log('📰 NEWS_API_KEY not set — using mock news dataset');
    return {
      articles: MOCK_NEWS.map((a) => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source,
        rawContent: a.rawContent,
      })),
      usedMockData: true,
    };
  }

  try {
    // Rotate queries to avoid duplication
    const query = SUPPLY_CHAIN_QUERIES[Math.floor(Math.random() * SUPPLY_CHAIN_QUERIES.length)];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!res.ok) {
      throw new Error(`NewsAPI error: ${res.status} ${res.statusText}`);
    }

    const data: NewsApiResponse = await res.json();

    if (data.status !== 'ok') {
      throw new Error('NewsAPI returned non-ok status');
    }

    const articles = data.articles
      .filter((a) => a.title && a.title !== '[Removed]')
      .map((a) => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source.name,
        rawContent: [a.description, a.content].filter(Boolean).join(' ').substring(0, 2000),
      }));

    return { articles, usedMockData: false };
  } catch (err) {
    console.error('NewsAPI fetch failed, falling back to mock data:', err);
    return {
      articles: MOCK_NEWS.map((a) => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source,
        rawContent: a.rawContent,
      })),
      usedMockData: true,
    };
  }
}
