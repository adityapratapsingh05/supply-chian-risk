import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeCascade } from '@/lib/scoring';
import { MOCK_SUPPLIERS, MOCK_SIMULATION_RUNS } from '@/lib/mock-data';
import type { Supplier, SimulationScenario } from '@/types';
import { claudeStructured, hasApiKey } from '@/lib/claude';
import { MitigationResponseSchema } from '@/lib/schemas';

const PRESET_SCENARIOS: Omit<SimulationScenario, 'affectedSupplierId'>[] = [
  {
    name: 'Major Port Closure',
    description: 'A major port in the region closes due to labor strikes, causing complete shipping lane disruption',
    eventType: 'logistics',
    severity: 9,
    cascadeDepth: 3,
  },
  {
    name: 'Geopolitical Conflict',
    description: 'Military escalation in the Taiwan Strait triggers trade route closures and export bans',
    eventType: 'geo-political',
    severity: 10,
    cascadeDepth: 4,
  },
  {
    name: 'Cyber Attack',
    description: 'Coordinated ransomware attack disables production management systems across the region',
    eventType: 'cyber',
    severity: 8,
    cascadeDepth: 2,
  },
  {
    name: 'Pandemic Outbreak',
    description: 'A new health crisis forces factory shutdowns and restricts worker movement',
    eventType: 'pandemic/health',
    severity: 9,
    cascadeDepth: 3,
  },
  {
    name: 'Natural Disaster',
    description: 'Major earthquake damages manufacturing infrastructure and disrupts power grid',
    eventType: 'natural disaster',
    severity: 9,
    cascadeDepth: 3,
  },
];


export async function POST(request: Request) {
  const startTime = Date.now();
  const body = await request.json();

  const scenario: SimulationScenario = {
    name: body.name ?? 'Custom Scenario',
    description: body.description ?? 'Custom disruption event',
    affectedSupplierId: body.affectedSupplierId ?? 'sup_001',
    eventType: body.eventType ?? 'geo-political',
    severity: body.severity ?? 8,
    cascadeDepth: body.cascadeDepth ?? 3,
    customDescription: body.customDescription,
  };

  const eventDescription = body.customDescription || `${scenario.name}: ${scenario.description}`;

  let suppliers: Supplier[] = MOCK_SUPPLIERS;
  let usedMockData = false;

  try {
    const dbSuppliers = await prisma.supplier.findMany();
    suppliers = dbSuppliers.map((s) => ({
      ...s,
      categoryExposure: JSON.parse(s.categoryExposure),
      upstreamIds: JSON.parse(s.upstreamIds),
      downstreamIds: JSON.parse(s.downstreamIds),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  } catch {
    usedMockData = true;
  }

  const hitSupplier = suppliers.find((s) => s.id === scenario.affectedSupplierId) ?? suppliers[0];

  // Run cascade analysis
  const { analysis, usedMockData: cascadeMock } = await analyzeCascade(
    hitSupplier,
    suppliers,
    eventDescription
  );
  if (cascadeMock) usedMockData = true;

  // Generate mitigation for the hit supplier
  let mitigation = null;
  if (hasApiKey && !usedMockData) {
    try {
      const systemPrompt = `You are a supply chain resilience expert. Generate emergency mitigation strategies for a simulated disruption.`;
      const userMessage = `Scenario: ${eventDescription}
Affected Supplier: ${hitSupplier.name} (${hitSupplier.region})
Cascade Impact: ${analysis.briefingSummary}

Generate rapid-response mitigation strategies.

Respond with JSON:
{
  "summary": "emergency response summary",
  "alternateSuppliers": [{"name":"","location":"","leadTime":"","costPremium":"","reliability":""}],
  "inventoryAdjustment": [{"action":"","component":"","targetBuffer":"","estimatedCost":"","timeframe":""}],
  "logisticsRerouting": [{"currentRoute":"","alternativeRoute":"","additionalCost":"","timeImpact":""}]
}`;
      const { data } = await claudeStructured(systemPrompt, userMessage, MitigationResponseSchema);
      mitigation = data;
    } catch {
      mitigation = null;
    }
  }

  const responseTimeMs = Date.now() - startTime;

  const result = {
    scenario,
    affectedSuppliers: analysis.affectedSuppliers.map((a) => ({
      supplier: suppliers.find((s) => s.id === a.supplierId) ?? hitSupplier,
      newRiskScore: a.newRiskScore,
      newImpactScore: a.newImpactScore,
      cascadeOrder: a.cascadeOrder,
      reasoning: a.reasoning,
    })),
    cascadePath: analysis.cascadePath,
    mitigations: mitigation ? [{ id: `sim_mit_${Date.now()}`, supplierId: hitSupplier.id, riskEventId: null, ...mitigation, createdAt: new Date().toISOString() }] : [],
    totalImpact: analysis.totalImpact,
    responseTimeMs,
    briefingSummary: analysis.briefingSummary,
  };

  // Save simulation run
  try {
    await prisma.simulationRun.create({
      data: {
        scenarioName: scenario.name,
        scenarioParams: JSON.stringify(scenario),
        results: JSON.stringify(result),
        responseTimeMs,
      },
    });
  } catch {
    // DB not available
  }

  return NextResponse.json({
    success: true,
    data: result,
    usedMockData,
    responseTimeMs,
  });
}

export async function GET() {
  // Return preset scenarios list + recent run history
  try {
    const runs = await prisma.simulationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json({
      success: true,
      data: {
        presets: PRESET_SCENARIOS,
        history: runs.map((r) => ({
          ...r,
          scenarioParams: JSON.parse(r.scenarioParams),
          results: JSON.parse(r.results),
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        presets: PRESET_SCENARIOS,
        history: MOCK_SIMULATION_RUNS,
      },
      usedMockData: true,
    });
  }
}
