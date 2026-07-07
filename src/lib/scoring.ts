import { claudeStructured, hasApiKey } from './claude';
import { RiskScoreSchema, NewsClassificationSchema, CascadeAnalysisSchema, type RiskScore } from './schemas';
import type { Supplier, NewsArticle } from '@/types';
import { MOCK_RISK_EVENTS } from './mock-data';

// ─── News Classification ───────────────────────────────────────────────────────
export async function classifyNewsArticle(article: {
  title: string;
  rawContent: string;
}): Promise<{
  classifiedCategory: string;
  affectedGeography: string;
  affectedCompany: string;
  severity: number;
  usedMockData: boolean;
}> {
  if (!hasApiKey) {
    // Mock classification based on keyword matching
    const text = (article.title + ' ' + article.rawContent).toLowerCase();
    let category = 'geo-political';
    if (text.includes('cyber') || text.includes('hack') || text.includes('ransomware')) category = 'cyber';
    else if (text.includes('port') || text.includes('shipping') || text.includes('logistics')) category = 'logistics';
    else if (text.includes('labor') || text.includes('worker') || text.includes('strike')) category = 'labor';
    else if (text.includes('climate') || text.includes('flood') || text.includes('typhoon')) category = 'climate';
    else if (text.includes('trade') || text.includes('tariff') || text.includes('sanction')) category = 'trade policy';
    else if (text.includes('earthquake') || text.includes('disaster') || text.includes('natural')) category = 'natural disaster';
    else if (text.includes('pandemic') || text.includes('covid') || text.includes('health')) category = 'pandemic/health';
    else if (text.includes('financial') || text.includes('bankruptcy') || text.includes('market')) category = 'financial';

    return {
      classifiedCategory: category,
      affectedGeography: text.includes('china') ? 'China' : text.includes('taiwan') ? 'Taiwan' : 'Global',
      affectedCompany: 'Unknown',
      severity: 5,
      usedMockData: true,
    };
  }

  const systemPrompt = `You are a supply chain risk analyst specializing in global disruption classification.
Analyze the news article and classify it according to supply chain risk categories.
Your response must be valid JSON matching the schema exactly.`;

  const userMessage = `Classify this supply chain risk news article:

Title: ${article.title}
Content: ${article.rawContent}

Respond with JSON in this exact format:
{
  "category": "one of: geo-political|climate|logistics|regulatory|labor|cyber|financial|pandemic/health|trade policy|natural disaster",
  "affectedGeography": "country or region name",
  "affectedCompany": "company name or 'Unknown'",
  "severity": 1-10,
  "reasoning": "brief explanation"
}`;

  try {
    const { data } = await claudeStructured(systemPrompt, userMessage, NewsClassificationSchema);
    return {
      classifiedCategory: data.category,
      affectedGeography: data.affectedGeography,
      affectedCompany: data.affectedCompany,
      severity: data.severity,
      usedMockData: false,
    };
  } catch {
    return {
      classifiedCategory: 'geo-political',
      affectedGeography: 'Unknown',
      affectedCompany: 'Unknown',
      severity: 5,
      usedMockData: true,
    };
  }
}

// ─── Supplier Risk Scoring ─────────────────────────────────────────────────────
export async function scoreSupplierRisk(
  supplier: Supplier,
  recentNews: NewsArticle[]
): Promise<{ score: RiskScore; usedMockData: boolean }> {
  if (!hasApiKey) {
    // Return seeded mock scores for known suppliers
    const mockEvent = MOCK_RISK_EVENTS.find((e) => e.supplierId === supplier.id);
    return {
      score: {
        disruptionProbability: mockEvent?.disruptionProbability ?? supplier.currentRiskScore,
        impactScore: mockEvent?.impactScore ?? supplier.currentImpactScore,
        reasoning: mockEvent?.reasoning ?? 'Score based on baseline risk assessment',
        topRiskFactors: supplier.categoryExposure.slice(0, 3),
        confidence: 'medium',
      },
      usedMockData: true,
    };
  }

  const newsContext = recentNews
    .slice(0, 5)
    .map((n) => `- [${n.classifiedCategory}] ${n.title} (Severity: ${n.severity}/10, Affects: ${n.affectedGeography})`)
    .join('\n');

  const systemPrompt = `You are a supply chain risk quantification model with expertise in geopolitical, logistics, and operational risk assessment.
Score the disruption risk for a specific supplier based on current news intelligence.
Your response must be valid JSON only — no markdown, no explanation outside the JSON.`;

  const userMessage = `Score the disruption risk for this supplier:

Supplier: ${supplier.name}
Tier: ${supplier.tier} (${supplier.tier === 3 ? 'Raw Materials' : supplier.tier === 2 ? 'Component Manufacturing' : 'Assembly/Distribution'})
Location: ${supplier.region}, ${supplier.country}
Risk Exposure Categories: ${supplier.categoryExposure.join(', ')}
Description: ${supplier.description}

Recent relevant news:
${newsContext || 'No recent news classified for this supplier'}

Respond with JSON:
{
  "disruptionProbability": 0.0-1.0,
  "impactScore": 0.0-10.0,
  "reasoning": "explanation of key risk factors",
  "topRiskFactors": ["factor1", "factor2", "factor3"],
  "confidence": "high|medium|low"
}`;

  try {
    const { data } = await claudeStructured(systemPrompt, userMessage, RiskScoreSchema);
    return { score: data, usedMockData: false };
  } catch {
    return {
      score: {
        disruptionProbability: supplier.currentRiskScore,
        impactScore: supplier.currentImpactScore,
        reasoning: 'Fallback to cached risk score due to scoring service unavailability',
        topRiskFactors: supplier.categoryExposure.slice(0, 3),
        confidence: 'low',
      },
      usedMockData: true,
    };
  }
}

// ─── Cascade Analysis ─────────────────────────────────────────────────────────
export async function analyzeCascade(
  hitSupplier: Supplier,
  allSuppliers: Supplier[],
  scenarioDescription: string
): Promise<{ analysis: import('./schemas').CascadeAnalysis; usedMockData: boolean }> {
  if (!hasApiKey) {
    // Build cascade from graph structure
    const cascade: string[] = [hitSupplier.id];
    const visited = new Set<string>([hitSupplier.id]);

    const findDownstream = (ids: string[]) => {
      for (const id of ids) {
        if (!visited.has(id)) {
          visited.add(id);
          cascade.push(id);
          const sup = allSuppliers.find((s) => s.id === id);
          if (sup) findDownstream(sup.downstreamIds);
        }
      }
    };
    findDownstream(hitSupplier.downstreamIds);

    const affectedSuppliers = cascade.map((id, idx) => {
      const sup = allSuppliers.find((s) => s.id === id)!;
      const dampening = Math.pow(0.7, idx);
      return {
        supplierId: id,
        newRiskScore: Math.min(0.95, sup.currentRiskScore + 0.3 * dampening),
        newImpactScore: Math.min(10, sup.currentImpactScore + 1.5 * dampening),
        cascadeOrder: idx,
        reasoning: idx === 0 ? `Direct impact: ${scenarioDescription}` : `Cascade order ${idx}: affected by upstream disruption`,
      };
    });

    return {
      analysis: {
        affectedSuppliers,
        cascadePath: cascade,
        totalImpact: Math.min(10, hitSupplier.currentImpactScore + 1.5),
        briefingSummary: `The scenario "${scenarioDescription}" directly impacts ${hitSupplier.name} and cascades through ${cascade.length - 1} downstream nodes, affecting ${cascade.length} total supply chain participants.`,
      },
      usedMockData: true,
    };
  }

  const networkContext = allSuppliers
    .map((s) => `- ${s.name} (Tier ${s.tier}, ${s.region}): downstream=[${s.downstreamIds.join(',')}], riskScore=${s.currentRiskScore.toFixed(2)}`)
    .join('\n');

  const systemPrompt = `You are a supply chain network analyst specializing in disruption cascade modeling.
Given a disruption event at a specific supplier node, model how the impact propagates downstream through the supply network.
Your response must be valid JSON only.`;

  const userMessage = `Model the cascade impact of this disruption:

Event: ${scenarioDescription}
Directly Affected Supplier: ${hitSupplier.name} (${hitSupplier.id}, Tier ${hitSupplier.tier})

Full Supply Network:
${networkContext}

Analyze how the disruption cascades downstream. For each affected supplier, compute updated risk scores.

Respond with JSON:
{
  "affectedSuppliers": [
    {
      "supplierId": "sup_xxx",
      "newRiskScore": 0.0-1.0,
      "newImpactScore": 0.0-10.0,
      "cascadeOrder": 0,
      "reasoning": "explanation"
    }
  ],
  "cascadePath": ["sup_id1", "sup_id2"],
  "totalImpact": 0.0-10.0,
  "briefingSummary": "executive summary of cascade impact"
}`;

  const { data } = await claudeStructured(systemPrompt, userMessage, CascadeAnalysisSchema);
  return { analysis: data, usedMockData: false };
}
