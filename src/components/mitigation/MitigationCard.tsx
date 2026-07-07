'use client';

import { useState } from 'react';
import type { MitigationStrategy } from '@/types';

interface MitigationCardProps {
  strategy: MitigationStrategy;
}

type Tab = 'summary' | 'suppliers' | 'inventory' | 'logistics';

export function MitigationCard({ strategy }: MitigationCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'summary', label: 'Overview' },
    { id: 'suppliers', label: 'Alt. Suppliers', count: strategy.alternateSuppliers.length },
    { id: 'inventory', label: 'Inventory', count: strategy.inventoryAdjustment.length },
    { id: 'logistics', label: 'Logistics', count: strategy.logisticsRerouting.length },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-in"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all duration-150 relative flex-1"
            style={{
              color: activeTab === tab.id ? '#38bdf8' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              background: activeTab === tab.id ? 'rgba(56,189,248,0.05)' : 'transparent',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: activeTab === tab.id ? '#38bdf820' : '#1e293b',
                  color: activeTab === tab.id ? '#38bdf8' : '#475569',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div
              className="rounded-lg p-3 text-sm text-slate-300 leading-relaxed"
              style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)' }}
            >
              {strategy.summary}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg p-2 bg-slate-800/50">
                <div className="text-lg font-bold text-sky-400">{strategy.alternateSuppliers.length}</div>
                <div className="text-[10px] text-slate-500">Alt Suppliers</div>
              </div>
              <div className="rounded-lg p-2 bg-slate-800/50">
                <div className="text-lg font-bold text-emerald-400">{strategy.inventoryAdjustment.length}</div>
                <div className="text-[10px] text-slate-500">Inv. Actions</div>
              </div>
              <div className="rounded-lg p-2 bg-slate-800/50">
                <div className="text-lg font-bold text-violet-400">{strategy.logisticsRerouting.length}</div>
                <div className="text-[10px] text-slate-500">Route Options</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-right">
              Generated {new Date(strategy.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-3">
            {strategy.alternateSuppliers.map((alt, idx) => (
              <div key={idx} className="rounded-lg p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-white">{alt.name}</div>
                  <span className="text-[10px] font-bold text-orange-400 px-1.5 py-0.5 rounded bg-orange-400/10 border border-orange-400/20">
                    {alt.costPremium}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {alt.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {alt.leadTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {alt.reliability}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-3">
            {strategy.inventoryAdjustment.map((adj, idx) => (
              <div key={idx} className="rounded-lg p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-emerald-400">{adj.action}</div>
                    <div className="text-sm font-medium text-white mt-0.5">{adj.component}</div>
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded">{adj.targetBuffer}</span>
                </div>
                <div className="flex gap-4 text-[11px] text-slate-400">
                  <span>Cost: <span className="text-orange-400 font-medium">{adj.estimatedCost}</span></span>
                  <span>Timeframe: <span className="text-sky-400 font-medium">{adj.timeframe}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-3">
            {strategy.logisticsRerouting.map((route, idx) => (
              <div key={idx} className="rounded-lg p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 mb-0.5">Current Route</div>
                      <div className="text-xs text-slate-300 line-through opacity-60">{route.currentRoute}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="flex-1 h-px bg-slate-700" />
                    <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Alternative Route</div>
                    <div className="text-xs text-sky-300 font-medium">{route.alternativeRoute}</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                  <span>Extra Cost: <span className="text-orange-400 font-medium">{route.additionalCost}</span></span>
                  <span>Time: <span className="text-yellow-400 font-medium">{route.timeImpact}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
