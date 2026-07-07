import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { claudeStructured, hasApiKey } from '@/lib/claude';
import { ExecutiveBriefingSchema } from '@/lib/schemas';
import { MOCK_SUPPLIERS, MOCK_RISK_EVENTS, MOCK_NEWS } from '@/lib/mock-data';
import type { Supplier } from '@/types';

function getMockBriefing() {
  return {
    generatedAt: new Date().toISOString(),
    overallRiskLevel: 'HIGH' as const,
    overallRiskScore: 7.2,
    executiveSummary: 'The smartphone supply chain is currently experiencing elevated risk across all tiers, driven primarily by geopolitical tensions in the Taiwan Strait, rare earth export restrictions from China, and labor unrest at key assembly facilities. Immediate action is required to secure alternative sourcing for critical components and build safety stock buffers.',
    topThreats: [
      {
        rank: 1,
        supplierId: 'sup_001',
        supplierName: 'Rare Earth Mining Co.',
        threat: 'China export controls on rare earth minerals threaten continuous supply of critical components',
        probability: 0.72,
        impact: 8.1,
        recommendation: 'Activate emergency sourcing from Australian and US rare earth suppliers within 30 days',
      },
      {
        rank: 2,
        supplierId: 'sup_004',
        supplierName: 'Precision Assembly Corp.',
        threat: 'Labor unrest causing 30-40% production drop at primary assembly facility',
        probability: 0.55,
        impact: 9.0,
        recommendation: 'Engage labor mediators, begin qualification of Vietnam assembly capacity',
      },
      {
        rank: 3,
        supplierId: 'sup_002',
        supplierName: 'Advanced PCB Ltd.',
        threat: 'Taiwan Strait tensions creating dual risk: shipping disruption and potential conflict escalation',
        probability: 0.65,
        impact: 7.4,
        recommendation: 'Increase PCB safety stock to 90 days and pre-position components at Singapore hub',
      },
    ],
    cascadeImpactSummary: 'A disruption at Rare Earth Mining Co. (Tier 3) would cascade through Advanced PCB Ltd. and OLED Display Systems (Tier 2), ultimately halting Precision Assembly Corp. operations within 45-60 days. The total network impact score is 8.4/10, with estimated revenue impact of $180-240M per week of disruption.',
    recommendedActions: [
      { priority: 'IMMEDIATE' as const, action: 'Increase rare earth safety stock to 90 days', owner: 'VP Procurement', deadline: '2024-02-15', expectedOutcome: 'Buffer against 3-month export control scenario' },
      { priority: 'IMMEDIATE' as const, action: 'Activate labor mediation at Precision Assembly Corp.', owner: 'VP Operations', deadline: '2024-01-20', expectedOutcome: 'Restore full production capacity within 2 weeks' },
      { priority: 'SHORT_TERM' as const, action: 'Qualify Vietnam assembly facility as secondary site', owner: 'Supply Chain Director', deadline: '2024-03-01', expectedOutcome: 'Geographic diversification of 30% of assembly volume' },
      { priority: 'SHORT_TERM' as const, action: 'Establish pre-positioned inventory at Singapore hub', owner: 'Logistics Director', deadline: '2024-02-28', expectedOutcome: 'Reduce final delivery risk from 6.1/10 to 3.5/10' },
      { priority: 'LONG_TERM' as const, action: 'Diversify rare earth sourcing to 3+ countries', owner: 'Chief Procurement Officer', deadline: '2024-06-30', expectedOutcome: 'Eliminate single-country rare earth dependency' },
    ],
    riskTrend: 'DETERIORATING' as const,
    nextReviewDate: '2024-01-22',
  };
}

export async function POST() {
  const startTime = Date.now();

  let suppliers: Supplier[] = MOCK_SUPPLIERS;
  let riskEvents = MOCK_RISK_EVENTS;
  let recentNews = MOCK_NEWS;
  let usedMockData = false;

  try {
    const dbSuppliers = await prisma.supplier.findMany({ orderBy: { currentRiskScore: 'desc' } });
    suppliers = dbSuppliers.map((s) => ({
      ...s,
      categoryExposure: JSON.parse(s.categoryExposure),
      upstreamIds: JSON.parse(s.upstreamIds),
      downstreamIds: JSON.parse(s.downstreamIds),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    const dbEvents = await prisma.riskEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    riskEvents = dbEvents.map((e) => ({
      ...e,
      newsArticleId: e.newsArticleId ?? null,
      createdAt: e.createdAt.toISOString(),
    }));

    const dbNews = await prisma.newsArticle.findMany({
      orderBy: { severity: 'desc' },
      take: 5,
    });
    recentNews = dbNews.map((n) => ({
      ...n,
      publishedAt: n.publishedAt.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));
  } catch {
    usedMockData = true;
  }

  if (!hasApiKey || usedMockData) {
    return NextResponse.json({
      success: true,
      data: getMockBriefing(),
      usedMockData: true,
      generatedAt: new Date().toISOString(),
    });
  }

  const supplierContext = suppliers
    .map((s) => `- ${s.name} (Tier ${s.tier}, ${s.country}): Risk=${s.currentRiskScore.toFixed(2)}, Impact=${s.currentImpactScore.toFixed(1)}/10`)
    .join('\n');

  const newsContext = recentNews
    .slice(0, 5)
    .map((n) => `- [${n.classifiedCategory}] ${n.title} (Severity: ${n.severity}/10)`)
    .join('\n');

  const avgRisk = suppliers.reduce((sum, s) => sum + s.currentRiskScore, 0) / suppliers.length;
  const maxImpact = Math.max(...suppliers.map((s) => s.currentImpactScore));

  const systemPrompt = `You are a Chief Risk Officer preparing an executive briefing for the C-suite.
Generate a concise, data-driven briefing on supply chain risk.
Your response must be valid JSON only.`;

  const userMessage = `Generate an executive briefing based on this supply chain risk data:

SUPPLIER RISK SCORES:
${supplierContext}

RECENT NEWS THREATS:
${newsContext}

OVERALL METRICS:
- Average Risk Score: ${avgRisk.toFixed(2)}
- Maximum Impact Score: ${maxImpact.toFixed(1)}/10
- High-Risk Suppliers (>0.6): ${suppliers.filter((s) => s.currentRiskScore > 0.6).length}

Respond with JSON:
{
  "overallRiskLevel": "CRITICAL|HIGH|MEDIUM|LOW",
  "overallRiskScore": 0.0-10.0,
  "executiveSummary": "2-3 paragraph summary",
  "topThreats": [
    {
      "rank": 1,
      "supplierId": "sup_xxx",
      "supplierName": "name",
      "threat": "description",
      "probability": 0.0-1.0,
      "impact": 0.0-10.0,
      "recommendation": "specific action"
    }
  ],
  "cascadeImpactSummary": "cascade risk paragraph",
  "recommendedActions": [
    {
      "priority": "IMMEDIATE|SHORT_TERM|LONG_TERM",
      "action": "specific action",
      "owner": "role title",
      "deadline": "YYYY-MM-DD",
      "expectedOutcome": "outcome description"
    }
  ],
  "riskTrend": "IMPROVING|STABLE|DETERIORATING",
  "nextReviewDate": "YYYY-MM-DD"
}`;

  try {
    const { data } = await claudeStructured(systemPrompt, userMessage, ExecutiveBriefingSchema);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        generatedAt: new Date().toISOString(),
      },
      usedMockData: false,
      generatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startTime,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
