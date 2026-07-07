import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchNewsArticles } from '@/lib/news';
import { classifyNewsArticle } from '@/lib/scoring';
import { MOCK_NEWS } from '@/lib/mock-data';

export async function POST() {
  const startTime = Date.now();

  try {
    // 1. Fetch articles (real API or mock)
    const { articles, usedMockData: usedMockNews } = await fetchNewsArticles();

    const results: Array<{
      title: string;
      category: string;
      severity: number;
      usedMockData: boolean;
    }> = [];

    let usedMockClassification = false;

    for (const article of articles.slice(0, 8)) {
      // Classify each article
      const classification = await classifyNewsArticle({
        title: article.title,
        rawContent: article.rawContent,
      });

      if (classification.usedMockData) usedMockClassification = true;

      // Upsert in DB (avoid duplicates by title)
      try {
        await prisma.newsArticle.upsert({
          where: { id: `news_${Buffer.from(article.title).toString('base64').substring(0, 20)}` },
          create: {
            id: `news_${Buffer.from(article.title).toString('base64').substring(0, 20)}`,
            title: article.title,
            url: article.url,
            publishedAt: new Date(article.publishedAt),
            source: article.source,
            rawContent: article.rawContent.substring(0, 2000),
            classifiedCategory: classification.classifiedCategory,
            affectedGeography: classification.affectedGeography,
            affectedCompany: classification.affectedCompany,
            severity: classification.severity,
            processed: true,
          },
          update: {
            classifiedCategory: classification.classifiedCategory,
            affectedGeography: classification.affectedGeography,
            affectedCompany: classification.affectedCompany,
            severity: classification.severity,
            processed: true,
          },
        });
      } catch {
        // DB not available — continue without saving
      }

      results.push({
        title: article.title,
        category: classification.classifiedCategory,
        severity: classification.severity,
        usedMockData: classification.usedMockData,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
        usedMockData: usedMockNews || usedMockClassification,
        elapsedMs: Date.now() - startTime,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({
      success: true,
      data: articles.map((a) => ({
        ...a,
        publishedAt: a.publishedAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: MOCK_NEWS,
      usedMockData: true,
    });
  }
}
