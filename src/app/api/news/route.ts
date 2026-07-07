import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MOCK_NEWS } from '@/lib/mock-data';

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
