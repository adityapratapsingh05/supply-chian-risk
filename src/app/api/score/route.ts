import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scoreSupplierRisk } from '@/lib/scoring';
import { MOCK_SUPPLIERS, MOCK_NEWS, MOCK_RISK_EVENTS } from '@/lib/mock-data';
import type { Supplier } from '@/types';

function parseSupplier(s: {
  id: string; name: string; tier: number; lat: number; lng: number;
  country: string; region: string; categoryExposure: string;
  upstreamIds: string; downstreamIds: string; currentRiskScore: number;
  currentImpactScore: number; description: string; createdAt: Date; updatedAt: Date;
}): Supplier {
  return {
    ...s,
    categoryExposure: JSON.parse(s.categoryExposure),
    upstreamIds: JSON.parse(s.upstreamIds),
    downstreamIds: JSON.parse(s.downstreamIds),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const body = await request.json().catch(() => ({}));
  const targetSupplierId: string | undefined = body.supplierId;

  let suppliers: Supplier[] = [];
  let newsArticles = MOCK_NEWS;
  let usedMockData = false;

  // Load suppliers
  try {
    const dbSuppliers = await prisma.supplier.findMany();
    suppliers = dbSuppliers.map(parseSupplier);

    const dbNews = await prisma.newsArticle.findMany({
      where: { processed: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
    newsArticles = dbNews.map((a) => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
    }));
  } catch {
    suppliers = MOCK_SUPPLIERS;
    usedMockData = true;
  }

  const targetSuppliers = targetSupplierId
    ? suppliers.filter((s) => s.id === targetSupplierId)
    : suppliers;

  const results: Array<{
    supplierId: string;
    supplierName: string;
    disruptionProbability: number;
    impactScore: number;
    reasoning: string;
    usedMockData: boolean;
  }> = [];

  for (const supplier of targetSuppliers) {
    // Find relevant news for this supplier
    const relevantNews = newsArticles.filter(
      (n) =>
        n.affectedGeography.toLowerCase().includes(supplier.country.toLowerCase()) ||
        n.affectedCompany.toLowerCase().includes(supplier.name.toLowerCase().split(' ')[0])
    );

    const { score, usedMockData: scoreMock } = await scoreSupplierRisk(supplier, relevantNews);

    if (scoreMock) usedMockData = true;

    results.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      disruptionProbability: score.disruptionProbability,
      impactScore: score.impactScore,
      reasoning: score.reasoning,
      usedMockData: scoreMock,
    });

    // Update supplier in DB
    try {
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          currentRiskScore: score.disruptionProbability,
          currentImpactScore: score.impactScore,
        },
      });

      // Create risk event record
      await prisma.riskEvent.create({
        data: {
          supplierId: supplier.id,
          disruptionProbability: score.disruptionProbability,
          impactScore: score.impactScore,
          reasoning: score.reasoning,
        },
      });
    } catch {
      // DB not available
    }
  }

  // If using mock data, also return mock risk events
  if (usedMockData && !targetSupplierId) {
    return NextResponse.json({
      success: true,
      data: {
        scored: MOCK_SUPPLIERS.length,
        results: MOCK_RISK_EVENTS.map((e) => {
          const sup = MOCK_SUPPLIERS.find((s) => s.id === e.supplierId);
          return {
            supplierId: e.supplierId,
            supplierName: sup?.name ?? 'Unknown',
            disruptionProbability: e.disruptionProbability,
            impactScore: e.impactScore,
            reasoning: e.reasoning,
            usedMockData: true,
          };
        }),
        usedMockData: true,
        elapsedMs: Date.now() - startTime,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      scored: results.length,
      results,
      usedMockData,
      elapsedMs: Date.now() - startTime,
    },
  });
}
