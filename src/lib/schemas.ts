import { z } from 'zod';

// ─── News Classification Schema ────────────────────────────────────────────────
export const NewsClassificationSchema = z.object({
  category: z.enum([
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
  ]),
  affectedGeography: z.string().max(200),
  affectedCompany: z.string().max(200),
  severity: z.number().int().min(1).max(10),
  reasoning: z.string().max(500),
});

export type NewsClassification = z.infer<typeof NewsClassificationSchema>;

// ─── Risk Score Schema ─────────────────────────────────────────────────────────
export const RiskScoreSchema = z.object({
  disruptionProbability: z.number().min(0).max(1),
  impactScore: z.number().min(0).max(10),
  reasoning: z.string().max(1000),
  topRiskFactors: z.array(z.string()).max(5),
  confidence: z.enum(['high', 'medium', 'low']),
});

export type RiskScore = z.infer<typeof RiskScoreSchema>;

// ─── Mitigation Strategy Schema ────────────────────────────────────────────────
export const AlternateSupplierSchema = z.object({
  name: z.string(),
  location: z.string(),
  leadTime: z.string(),
  costPremium: z.string(),
  reliability: z.string(),
});

export const InventoryAdjustmentSchema = z.object({
  action: z.string(),
  component: z.string(),
  targetBuffer: z.string(),
  estimatedCost: z.string(),
  timeframe: z.string(),
});

export const LogisticsReroutingSchema = z.object({
  currentRoute: z.string(),
  alternativeRoute: z.string(),
  additionalCost: z.string(),
  timeImpact: z.string(),
});

export const MitigationResponseSchema = z.object({
  summary: z.string().max(1000),
  alternateSuppliers: z.array(AlternateSupplierSchema).max(3),
  inventoryAdjustment: z.array(InventoryAdjustmentSchema).max(4),
  logisticsRerouting: z.array(LogisticsReroutingSchema).max(3),
});

export type MitigationResponse = z.infer<typeof MitigationResponseSchema>;

// ─── Cascade Analysis Schema ───────────────────────────────────────────────────
export const CascadeSupplierSchema = z.object({
  supplierId: z.string(),
  newRiskScore: z.number().min(0).max(1),
  newImpactScore: z.number().min(0).max(10),
  cascadeOrder: z.number().int().min(0).max(5),
  reasoning: z.string().max(500),
});

export const CascadeAnalysisSchema = z.object({
  affectedSuppliers: z.array(CascadeSupplierSchema),
  cascadePath: z.array(z.string()),
  totalImpact: z.number().min(0).max(10),
  briefingSummary: z.string().max(2000),
});

export type CascadeAnalysis = z.infer<typeof CascadeAnalysisSchema>;

// ─── Executive Briefing Schema ─────────────────────────────────────────────────
export const TopThreatSchema = z.object({
  rank: z.number().int().min(1).max(3),
  supplierId: z.string(),
  supplierName: z.string(),
  threat: z.string(),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(10),
  recommendation: z.string(),
});

export const RecommendedActionSchema = z.object({
  priority: z.enum(['IMMEDIATE', 'SHORT_TERM', 'LONG_TERM']),
  action: z.string(),
  owner: z.string(),
  deadline: z.string(),
  expectedOutcome: z.string(),
});

export const ExecutiveBriefingSchema = z.object({
  overallRiskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  overallRiskScore: z.number().min(0).max(10),
  executiveSummary: z.string().max(2000),
  topThreats: z.array(TopThreatSchema).max(3),
  cascadeImpactSummary: z.string().max(1000),
  recommendedActions: z.array(RecommendedActionSchema).max(6),
  riskTrend: z.enum(['IMPROVING', 'STABLE', 'DETERIORATING']),
  nextReviewDate: z.string(),
});

export type ExecutiveBriefingResponse = z.infer<typeof ExecutiveBriefingSchema>;
