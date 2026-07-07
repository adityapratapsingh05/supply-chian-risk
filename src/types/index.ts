// ─── Risk Categories ──────────────────────────────────────────────────────────
export const RISK_CATEGORIES = [
  'geo-political',
  'climate',
  'logistics',
  'regulatory',
  'labor',
  'cyber',
  'financial',
  'pandemic/health',
  'trade policy',
  'natural disaster',
] as const;

export type RiskCategory = typeof RISK_CATEGORIES[number];

// ─── Supplier ──────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  tier: number;
  lat: number;
  lng: number;
  country: string;
  region: string;
  categoryExposure: RiskCategory[];
  upstreamIds: string[];
  downstreamIds: string[];
  currentRiskScore: number;   // 0-1
  currentImpactScore: number; // 0-10
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ─── News Article ──────────────────────────────────────────────────────────────
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  rawContent: string;
  classifiedCategory: string;
  affectedGeography: string;
  affectedCompany: string;
  severity: number;
  processed: boolean;
  createdAt: string;
}

// ─── Risk Event ────────────────────────────────────────────────────────────────
export interface RiskEvent {
  id: string;
  supplierId: string;
  newsArticleId: string | null;
  disruptionProbability: number; // 0-1
  impactScore: number;           // 0-10
  reasoning: string;
  createdAt: string;
  supplier?: Supplier;
  newsArticle?: NewsArticle;
}

// ─── Mitigation Strategy ──────────────────────────────────────────────────────
export interface AlternateSupplier {
  name: string;
  location: string;
  leadTime: string;
  costPremium: string;
  reliability: string;
}

export interface InventoryAdjustment {
  action: string;
  component: string;
  targetBuffer: string;
  estimatedCost: string;
  timeframe: string;
}

export interface LogisticsRerouting {
  currentRoute: string;
  alternativeRoute: string;
  additionalCost: string;
  timeImpact: string;
}

export interface MitigationStrategy {
  id: string;
  supplierId: string;
  riskEventId: string | null;
  alternateSuppliers: AlternateSupplier[];
  inventoryAdjustment: InventoryAdjustment[];
  logisticsRerouting: LogisticsRerouting[];
  summary: string;
  createdAt: string;
}

// ─── Simulation ────────────────────────────────────────────────────────────────
export interface SimulationScenario {
  name: string;
  description: string;
  affectedSupplierId: string;
  eventType: RiskCategory;
  severity: number;
  cascadeDepth: number;
  customDescription?: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  affectedSuppliers: Array<{
    supplier: Supplier;
    newRiskScore: number;
    newImpactScore: number;
    cascadeOrder: number;
    reasoning: string;
  }>;
  cascadePath: string[];
  mitigations: MitigationStrategy[];
  totalImpact: number;
  responseTimeMs: number;
  briefingSummary: string;
}

export interface SimulationRun {
  id: string;
  scenarioName: string;
  scenarioParams: SimulationScenario;
  results: SimulationResult;
  responseTimeMs: number;
  createdAt: string;
}

// ─── Executive Briefing ────────────────────────────────────────────────────────
export interface ExecutiveBriefing {
  generatedAt: string;
  overallRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  overallRiskScore: number;
  executiveSummary: string;
  topThreats: Array<{
    rank: number;
    supplierId: string;
    supplierName: string;
    threat: string;
    probability: number;
    impact: number;
    recommendation: string;
  }>;
  cascadeImpactSummary: string;
  recommendedActions: Array<{
    priority: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
    action: string;
    owner: string;
    deadline: string;
    expectedOutcome: string;
  }>;
  riskTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  nextReviewDate: string;
}

// ─── Graph ─────────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Supplier & { isHighlighted?: boolean; cascadeOrder?: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
  data?: { isCascade?: boolean; cascadeOrder?: number };
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  usedMockData?: boolean;
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.7) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.3) return 'medium';
  if (score >= 0.1) return 'low';
  return 'none';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  const colors: Record<RiskLevel, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    none: '#6b7280',
  };
  return colors[level];
}
