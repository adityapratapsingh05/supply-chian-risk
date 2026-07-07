'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Supplier } from '@/types';
import { getRiskLevel, getRiskColor } from '@/types';

interface SupplierNodeData extends Supplier {
  isHighlighted?: boolean;
  cascadeOrder?: number;
  onClick?: (supplier: Supplier) => void;
}

const TIER_LABELS: Record<number, string> = {
  1: 'Assembly',
  2: 'Components',
  3: 'Raw Materials',
};

export const SupplierNode = memo(({ data }: NodeProps<SupplierNodeData>) => {
  const riskLevel = getRiskLevel(data.currentRiskScore);
  const riskColor = getRiskColor(data.currentRiskScore);
  const isCritical = riskLevel === 'critical';
  const isHigh = riskLevel === 'high';

  const borderColor = riskColor;
  const glowColor = `${riskColor}40`;

  return (
    <div
      className="relative cursor-pointer group"
      onClick={() => data.onClick?.(data)}
      style={{ filter: data.isHighlighted ? `drop-shadow(0 0 12px ${riskColor})` : undefined }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#475569', border: '2px solid #1e293b', width: 10, height: 10 }} />

      {/* Cascade order badge */}
      {data.cascadeOrder !== undefined && data.cascadeOrder >= 0 && (
        <div
          className="absolute -top-3 -right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: riskColor }}
        >
          {data.cascadeOrder === 0 ? '!' : data.cascadeOrder}
        </div>
      )}

      {/* Pulse ring for critical nodes */}
      {(isCritical || (data.isHighlighted && isHigh)) && (
        <div
          className="absolute inset-0 rounded-xl animate-ping opacity-30"
          style={{ backgroundColor: riskColor, borderRadius: '12px' }}
        />
      )}

      <div
        className="relative w-52 rounded-xl p-3 transition-all duration-200 group-hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 20px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Tier badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}
          >
            Tier {data.tier} · {TIER_LABELS[data.tier]}
          </span>
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: riskColor }}
          >
            {riskLevel}
          </span>
        </div>

        {/* Supplier name */}
        <div className="text-white font-semibold text-sm leading-tight mb-2 truncate" title={data.name}>
          {data.name}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mb-3">
          <svg className="w-3 h-3 flex-shrink-0" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-xs text-slate-400 truncate">{data.region}</span>
        </div>

        {/* Risk metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/80 rounded-lg p-2">
            <div className="text-[10px] text-slate-400 mb-0.5">Disruption Risk</div>
            <div className="font-bold text-sm" style={{ color: riskColor }}>
              {(data.currentRiskScore * 100).toFixed(0)}%
            </div>
            {/* Mini risk bar */}
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${data.currentRiskScore * 100}%`, backgroundColor: riskColor }}
              />
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2">
            <div className="text-[10px] text-slate-400 mb-0.5">Impact Score</div>
            <div className="font-bold text-sm" style={{ color: riskColor }}>
              {data.currentImpactScore.toFixed(1)}<span className="text-xs text-slate-400">/10</span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${data.currentImpactScore * 10}%`, backgroundColor: riskColor }}
              />
            </div>
          </div>
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {data.categoryExposure.slice(0, 2).map((cat) => (
            <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400 uppercase tracking-wide">
              {cat}
            </span>
          ))}
          {data.categoryExposure.length > 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400">
              +{data.categoryExposure.length - 2}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#475569', border: '2px solid #1e293b', width: 10, height: 10 }} />
    </div>
  );
});

SupplierNode.displayName = 'SupplierNode';
