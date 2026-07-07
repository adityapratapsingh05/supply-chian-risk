import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { claudeStructured, hasApiKey } from '@/lib/claude';
import { MitigationResponseSchema } from '@/lib/schemas';
import { MOCK_SUPPLIERS, MOCK_MITIGATIONS } from '@/lib/mock-data';

export async function POST(request: Request) {
  const body = await request.json();
  const { supplierId } = body;

  if (!supplierId) {
    return NextResponse.json({ success: false, error: 'supplierId required' }, { status: 400 });
  }

  let supplier = MOCK_SUPPLIERS.find((s) => s.id === supplierId);
  let riskContext = 'High risk detected based on recent supply chain news';
  let usedMockData = false;

  try {
    const dbSupplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (dbSupplier) {
      supplier = {
        ...dbSupplier,
        categoryExposure: JSON.parse(dbSupplier.categoryExposure),
        upstreamIds: JSON.parse(dbSupplier.upstreamIds),
        downstreamIds: JSON.parse(dbSupplier.downstreamIds),
        createdAt: dbSupplier.createdAt.toISOString(),
        updatedAt: dbSupplier.updatedAt.toISOString(),
      };

      // Get latest risk event for context
      const latestEvent = await prisma.riskEvent.findFirst({
        where: { supplierId },
        orderBy: { createdAt: 'desc' },
        include: { newsArticle: true },
      });

      if (latestEvent) {
        riskContext = `Risk Score: ${latestEvent.disruptionProbability.toFixed(2)}, Impact: ${latestEvent.impactScore.toFixed(1)}/10. ${latestEvent.reasoning}`;
        if (latestEvent.newsArticle) {
          riskContext += ` Related news: "${latestEvent.newsArticle.title}"`;
        }
      }
    }
  } catch {
    usedMockData = true;
  }

  if (!supplier) {
    return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
  }

  if (!hasApiKey || usedMockData) {
    const mockMitigation = MOCK_MITIGATIONS.find((m) => m.supplierId === supplierId);
    if (mockMitigation) {
      return NextResponse.json({
        success: true,
        data: mockMitigation,
        usedMockData: true,
      });
    }

    // Generate generic mock mitigation
    return NextResponse.json({
      success: true,
      data: {
        id: `mit_mock_${supplierId}`,
        supplierId,
        riskEventId: null,
        summary: `Mitigation strategies for ${supplier.name}: Diversify sourcing, increase safety stock, and establish alternative routing.`,
        alternateSuppliers: [
          { name: 'Alternative Supplier A', location: 'Vietnam', leadTime: '8-10 weeks', costPremium: '+12%', reliability: 'High (94%)' },
          { name: 'Alternative Supplier B', location: 'India', leadTime: '10-14 weeks', costPremium: '+8%', reliability: 'Medium (89%)' },
        ],
        inventoryAdjustment: [
          { action: 'Increase safety stock', component: 'Critical components', targetBuffer: '60 days', estimatedCost: '$1.5M', timeframe: '30 days' },
        ],
        logisticsRerouting: [
          { currentRoute: `${supplier.region} → Direct`, alternativeRoute: 'Alternative port routing', additionalCost: '+$85K/month', timeImpact: '+3-4 days' },
        ],
        createdAt: new Date().toISOString(),
      },
      usedMockData: true,
    });
  }

  const systemPrompt = `You are a supply chain resilience expert specializing in risk mitigation strategy development.
Generate specific, actionable mitigation strategies for a high-risk supplier situation.
Your response must be valid JSON only.`;

  const userMessage = `Generate mitigation strategies for this high-risk supplier:

Supplier: ${supplier.name}
Location: ${supplier.region}, ${supplier.country}
Tier: ${supplier.tier}
Risk Exposure: ${supplier.categoryExposure.join(', ')}
Description: ${supplier.description}
Risk Context: ${riskContext}

Provide 2-3 alternate suppliers, 2-3 inventory adjustments, and 1-2 logistics rerouting options.

Respond with JSON:
{
  "summary": "executive summary of mitigation approach",
  "alternateSuppliers": [
    {
      "name": "supplier name",
      "location": "city, country",
      "leadTime": "X-Y weeks",
      "costPremium": "+X%",
      "reliability": "High/Medium/Low (X% on-time)"
    }
  ],
  "inventoryAdjustment": [
    {
      "action": "action description",
      "component": "component name",
      "targetBuffer": "X days",
      "estimatedCost": "$XM",
      "timeframe": "X days"
    }
  ],
  "logisticsRerouting": [
    {
      "currentRoute": "current route description",
      "alternativeRoute": "alternative route description",
      "additionalCost": "+$XK/month",
      "timeImpact": "+X days"
    }
  ]
}`;

  try {
    const { data } = await claudeStructured(systemPrompt, userMessage, MitigationResponseSchema);

    // Save to DB
    let savedId = `mit_${Date.now()}`;
    try {
      const saved = await prisma.mitigationStrategy.create({
        data: {
          supplierId,
          alternateSuppliers: JSON.stringify(data.alternateSuppliers),
          inventoryAdjustment: JSON.stringify(data.inventoryAdjustment),
          logisticsRerouting: JSON.stringify(data.logisticsRerouting),
          summary: data.summary,
        },
      });
      savedId = saved.id;
    } catch {
      // DB not available
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedId,
        supplierId,
        riskEventId: null,
        ...data,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId');

  try {
    const where = supplierId ? { supplierId } : {};
    const mitigations = await prisma.mitigationStrategy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: mitigations.map((m) => ({
        ...m,
        alternateSuppliers: JSON.parse(m.alternateSuppliers),
        inventoryAdjustment: JSON.parse(m.inventoryAdjustment),
        logisticsRerouting: JSON.parse(m.logisticsRerouting),
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: supplierId ? MOCK_MITIGATIONS.filter((m) => m.supplierId === supplierId) : MOCK_MITIGATIONS,
      usedMockData: true,
    });
  }
}
