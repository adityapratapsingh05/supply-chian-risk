'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import type { Supplier } from '@/types';
import { getRiskColor } from '@/types';

interface RiskChartProps {
  suppliers: Supplier[];
  type?: 'bar' | 'radar' | 'timeline';
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 border border-slate-700" style={{ background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(8px)' }}>
        <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-slate-400">{entry.name}:</span>
            <span className="text-xs font-bold" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RiskBarChart({ suppliers }: { suppliers: Supplier[] }) {
  const data = suppliers.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    riskScore: parseFloat((s.currentRiskScore * 10).toFixed(1)),
    impactScore: parseFloat(s.currentImpactScore.toFixed(1)),
    tier: s.tier,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
        <Bar dataKey="riskScore" name="Risk Score (×10)" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={getRiskColor(entry.riskScore / 10)} fillOpacity={0.85} />
          ))}
        </Bar>
        <Bar dataKey="impactScore" name="Impact Score" fill="#38bdf8" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RiskRadarChart({ supplier }: { supplier: Supplier }) {
  const data = supplier.categoryExposure.map((cat) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    score: Math.random() * 8 + 2, // In production, would use actual category scores
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 9 }} />
        <Radar
          name="Risk"
          dataKey="score"
          stroke={getRiskColor(supplier.currentRiskScore)}
          fill={getRiskColor(supplier.currentRiskScore)}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function RiskTimelineChart({ suppliers }: { suppliers: Supplier[] }) {
  // Simulated time series data
  const now = Date.now();
  const timeData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now - (13 - i) * 24 * 60 * 60 * 1000);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const point: Record<string, unknown> = { date: label };
    for (const s of suppliers) {
      const base = s.currentRiskScore;
      const variation = (Math.random() - 0.5) * 0.2;
      point[s.name.split(' ')[0]] = Math.max(0, Math.min(1, base + variation * (i / 14)));
    }
    return point;
  });

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#38bdf8'];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} />
        <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={{ stroke: '#334155' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
        {suppliers.map((s, idx) => (
          <Area
            key={s.id}
            type="monotone"
            dataKey={s.name.split(' ')[0]}
            stroke={colors[idx % colors.length]}
            fill={colors[idx % colors.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
