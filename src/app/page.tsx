'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Supplier, NewsArticle, MitigationStrategy } from '@/types';
import { getRiskColor, getRiskLevel } from '@/types';
import { RiskScoreCard } from '@/components/dashboard/RiskScoreCard';
import { NewsPanel } from '@/components/dashboard/NewsPanel';
import { RiskBarChart, RiskTimelineChart } from '@/components/dashboard/RiskChart';
import { MitigationCard } from '@/components/mitigation/MitigationCard';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner, InlineLoader } from '@/components/ui/LoadingSpinner';

// Dynamic import for React Flow (no SSR)
const SupplyChainGraph = dynamic(() => import('@/components/graph/SupplyChainGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500">
      <LoadingSpinner size="lg" label="Loading network graph..." />
    </div>
  ),
});

type ChartView = 'bar' | 'timeline';

export default function DashboardPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [mitigation, setMitigation] = useState<MitigationStrategy | null>(null);
  const [cascadePath, setCascadePath] = useState<string[]>([]);
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [usedMockData, setUsedMockData] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isMitigating, setIsMitigating] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<string>('');

  // Load suppliers and news on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [suppRes, newsRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/news'),
        ]);
        const suppData = await suppRes.json();
        const newsData = await newsRes.json();

        if (suppData.success) {
          setSuppliers(suppData.data);
          if (suppData.usedMockData) setUsedMockData(true);
        }
        if (newsData.success && Array.isArray(newsData.data)) {
          setNews(newsData.data);
        }
      } catch (err) {
        console.error('Load failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Load stored news articles
  const loadNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNews(data.data);
      }
    } catch {}
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      await fetch('/api/news/ingest', { method: 'POST' });
      await loadNews();
    } finally {
      setIsIngesting(false);
    }
  };

  const handleScoreAll = async () => {
    setIsScoring(true);
    setScoreStatus('Scoring all suppliers...');
    try {
      const res = await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.success) {
        setScoreStatus(`Scored ${data.data.scored} suppliers in ${data.data.elapsedMs}ms`);
        if (data.usedMockData) setUsedMockData(true);
        // Reload suppliers with new scores
        const suppRes = await fetch('/api/suppliers');
        const suppData = await suppRes.json();
        if (suppData.success) setSuppliers(suppData.data);
      }
    } finally {
      setIsScoring(false);
      setTimeout(() => setScoreStatus(''), 4000);
    }
  };

  const handleNodeClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setMitigation(null);

    // Highlight cascade path from this node
    const path: string[] = [supplier.id];
    const findDownstream = (ids: string[]) => {
      for (const id of ids) {
        if (!path.includes(id)) {
          path.push(id);
          const s = suppliers.find((x) => x.id === id);
          if (s) findDownstream(s.downstreamIds);
        }
      }
    };
    findDownstream(supplier.downstreamIds);
    setCascadePath(path);
  };

  const handleGetMitigation = async () => {
    if (!selectedSupplier) return;
    setIsMitigating(true);
    try {
      const res = await fetch('/api/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: selectedSupplier.id }),
      });
      const data = await res.json();
      if (data.success) setMitigation(data.data);
    } finally {
      setIsMitigating(false);
    }
  };

  const overallRisk = suppliers.length
    ? suppliers.reduce((sum, s) => sum + s.currentRiskScore, 0) / suppliers.length
    : 0;
  const criticalCount = suppliers.filter((s) => s.currentRiskScore >= 0.7).length;
  const highCount = suppliers.filter((s) => s.currentRiskScore >= 0.5 && s.currentRiskScore < 0.7).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <LoadingSpinner size="lg" label="Loading supply chain data..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* ─── Top header bar ─── */}
      <div
        className="flex-shrink-0 px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-bold text-white">Network Risk Dashboard</h1>
            <p className="text-xs text-slate-500">Smartphone OEM · 5 Suppliers · 3 Tiers</p>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getRiskColor(overallRisk) }} />
              <span className="text-xs text-slate-400">Overall Risk</span>
              <span className="text-sm font-bold" style={{ color: getRiskColor(overallRisk) }}>
                {(overallRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <span className="text-xs text-red-400 font-semibold">{criticalCount}</span>
              <span className="text-xs text-slate-400">Critical</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-orange-400 font-semibold">{highCount}</span>
              <span className="text-xs text-slate-400">High</span>
            </div>
            {usedMockData && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                ⚠ Mock Data — Add API keys for live data
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {scoreStatus && (
            <span className="text-[10px] text-emerald-400 animate-fade-in">{scoreStatus}</span>
          )}
          <button
            onClick={handleScoreAll}
            disabled={isScoring}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: isScoring ? '#334155' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
          >
            {isScoring ? <InlineLoader /> : '⚡'}
            {isScoring ? 'Scoring...' : 'Score All'}
          </button>
        </div>
      </div>

      {/* ─── Main 3-column layout ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Left: Supplier cards + charts ─── */}
        <div
          className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid #1e293b' }}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 px-1 mb-2">Supplier Risk</div>
            {suppliers.map((s) => (
              <ErrorBoundary key={s.id}>
                <RiskScoreCard
                  supplier={s}
                  onClick={handleNodeClick}
                  isSelected={selectedSupplier?.id === s.id}
                />
              </ErrorBoundary>
            ))}
          </div>

          {/* Chart section */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: '1px solid #1e293b' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Analytics</div>
              <div className="flex gap-1">
                {(['bar', 'timeline'] as ChartView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setChartView(v)}
                    className="text-[9px] px-2 py-0.5 rounded uppercase tracking-wide transition-colors"
                    style={{
                      background: chartView === v ? '#334155' : 'transparent',
                      color: chartView === v ? '#e2e8f0' : '#475569',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <ErrorBoundary>
              {chartView === 'bar' ? (
                <RiskBarChart suppliers={suppliers} />
              ) : (
                <RiskTimelineChart suppliers={suppliers} />
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* ─── Center: React Flow graph ─── */}
        <div className="flex-1 relative">
          <ErrorBoundary>
            <SupplyChainGraph
              suppliers={suppliers}
              cascadePath={cascadePath}
              onNodeClick={handleNodeClick}
            />
          </ErrorBoundary>

          {/* Cascade info overlay */}
          {cascadePath.length > 1 && (
            <div
              className="absolute bottom-4 left-4 rounded-xl px-4 py-3 animate-fade-in"
              style={{ background: 'rgba(8,15,26,0.95)', border: '1px solid #ef444440', backdropFilter: 'blur(8px)' }}
            >
              <div className="text-xs font-semibold text-red-400 mb-1">⚠ Cascade Impact Path</div>
              <div className="flex items-center gap-1.5">
                {cascadePath.map((id, idx) => {
                  const s = suppliers.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-300">{s?.name.split(' ')[0]}</span>
                      {idx < cascadePath.length - 1 && (
                        <span className="text-red-500 text-xs">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {cascadePath.length} nodes affected · {cascadePath.length - 1} order(s) of impact
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: News + Mitigation panel ─── */}
        <div
          className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderLeft: '1px solid #1e293b' }}
        >
          {/* Selected supplier detail */}
          {selectedSupplier && (
            <div
              className="flex-shrink-0 p-3 animate-slide-in"
              style={{ borderBottom: '1px solid #1e293b', background: '#0f172a' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-white">{selectedSupplier.name}</div>
                  <div className="text-[10px] text-slate-500">{selectedSupplier.region}</div>
                </div>
                <button
                  onClick={() => { setSelectedSupplier(null); setCascadePath([]); setMitigation(null); }}
                  className="text-slate-500 hover:text-slate-300 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{selectedSupplier.description}</p>
              <button
                onClick={handleGetMitigation}
                disabled={isMitigating}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  background: isMitigating ? '#334155' : `linear-gradient(135deg, ${getRiskColor(selectedSupplier.currentRiskScore)}30, ${getRiskColor(selectedSupplier.currentRiskScore)}10)`,
                  border: `1px solid ${getRiskColor(selectedSupplier.currentRiskScore)}40`,
                  color: getRiskColor(selectedSupplier.currentRiskScore),
                }}
              >
                {isMitigating ? <InlineLoader label="Generating strategies..." /> : '🛡 Generate Mitigation Strategies'}
              </button>

              {mitigation && (
                <div className="mt-3">
                  <ErrorBoundary>
                    <MitigationCard strategy={mitigation} />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          )}

          {/* News feed */}
          <div className="flex-1 overflow-hidden p-3">
            <ErrorBoundary>
              <NewsPanel
                articles={news}
                onIngest={handleIngest}
                isIngesting={isIngesting}
                usedMockData={usedMockData}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
