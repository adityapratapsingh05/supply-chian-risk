'use client';

import { getRiskColor, getRiskLevel, type Supplier } from '@/types';

interface RiskScoreCardProps {
  supplier: Supplier;
  onClick?: (supplier: Supplier) => void;
  isSelected?: boolean;
}

const TIER_LABELS: Record<number, string> = { 1: 'Assembly', 2: 'Components', 3: 'Raw Materials' };

export function RiskScoreCard({ supplier, onClick, isSelected }: RiskScoreCardProps) {
  const riskColor = getRiskColor(supplier.currentRiskScore);
  const riskLevel = getRiskLevel(supplier.currentRiskScore);
  const isCritical = riskLevel === 'critical';

  return (
    <div
      className="relative rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-fade-in"
      onClick={() => onClick?.(supplier)}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${riskColor}15 0%, #1e293b 100%)`
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: `1px solid ${isSelected ? riskColor : '#334155'}`,
        boxShadow: isSelected ? `0 0 20px ${riskColor}30` : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {isCritical && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 mb-0.5">
            Tier {supplier.tier} · {TIER_LABELS[supplier.tier]}
          </div>
          <div className="text-sm font-semibold text-white truncate">{supplier.name}</div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {supplier.country}
          </div>
        </div>
        <span
          className="ml-2 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide flex-shrink-0"
          style={{ backgroundColor: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}
        >
          {riskLevel}
        </span>
      </div>

      {/* Risk progress bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Disruption Risk</span>
            <span className="font-bold" style={{ color: riskColor }}>{(supplier.currentRiskScore * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${supplier.currentRiskScore * 100}%`, backgroundColor: riskColor }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Business Impact</span>
            <span className="font-bold" style={{ color: riskColor }}>{supplier.currentImpactScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${supplier.currentImpactScore * 10}%`, backgroundColor: riskColor }}
            />
          </div>
        </div>
      </div>

      {/* Category tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        {supplier.categoryExposure.slice(0, 3).map((cat) => (
          <span
            key={cat}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wide"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
