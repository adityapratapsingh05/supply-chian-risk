'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Supplier, SimulationScenario, SimulationResult, RiskCategory } from '@/types';
import { getRiskColor } from '@/types';
import { MitigationCard } from '@/components/mitigation/MitigationCard';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner, InlineLoader } from '@/components/ui/LoadingSpinner';

const SupplyChainGraph = dynamic(() => import('@/components/graph/SupplyChainGraph'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" label="Loading graph..." /></div>,
});

const PRESET_SCENARIOS = [
  { name: 'Major Port Closure', description: 'A major port closes due to labor strikes, causing complete shipping lane disruption', eventType: 'logistics' as RiskCategory, severity: 9, icon: '🚢', color: '#38bdf8' },
  { name: 'Geopolitical Conflict', description: 'Military escalation triggers trade route closures and export bans across the region', eventType: 'geo-political' as RiskCategory, severity: 10, icon: '⚔', color: '#ef4444' },
  { name: 'Ransomware Attack', description: 'Coordinated cyber attack disables production management systems', eventType: 'cyber' as RiskCategory, severity: 8, icon: '💻', color: '#a78bfa' },
  { name: 'Pandemic Outbreak', description: 'New health crisis forces factory shutdowns and worker movement restrictions', eventType: 'pandemic/health' as RiskCategory, severity: 9, icon: '🦠', color: '#f97316' },
  { name: 'Major Earthquake', description: 'Magnitude 7.5 earthquake damages manufacturing infrastructure and power grid', eventType: 'natural disaster' as RiskCategory, severity: 9, icon: '🌏', color: '#eab308' },
];

export default function SimulationPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState('sup_001');
  const [customDescription, setCustomDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [usedMockData, setUsedMockData] = useState(false);
  const [runHistory, setRunHistory] = useState<Array<{ name: string; time: number; impact: number; at: string }>>([]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSuppliers(d.data); })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setResult(null);
    const t0 = Date.now();

    const scenario = PRESET_SCENARIOS[selectedScenario];
    const payload: Partial<SimulationScenario> & { customDescription?: string } = {
      name: scenario.name,
      description: scenario.description,
      affectedSupplierId: selectedSupplierId,
      eventType: scenario.eventType,
      severity: scenario.severity,
      cascadeDepth: 3,
      customDescription: customDescription || undefined,
    };

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setResponseTime(Date.now() - t0);
        if (data.usedMockData) setUsedMockData(true);

        // Add to history
        setRunHistory((h) => [{
          name: scenario.name,
          time: Date.now() - t0,
          impact: data.data.totalImpact,
          at: new Date().toLocaleTimeString(),
        }, ...h.slice(0, 4)]);

        // Update supplier scores in local state
        for (const affected of data.data.affectedSuppliers) {
          setSuppliers((prev) => prev.map((s) =>
            s.id === affected.supplier.id
              ? { ...s, currentRiskScore: affected.newRiskScore, currentImpactScore: affected.newImpactScore }
              : s
          ));
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const cascadePath = result?.cascadePath ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <LoadingSpinner size="lg" label="Loading simulation engine..." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ─── Left: Scenario selector ─── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid #1e293b' }}
      >
        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid #1e293b' }}>
          <h1 className="text-base font-bold text-white mb-0.5">Disruption Simulator</h1>
          <p className="text-[11px] text-slate-500">Run end-to-end pipeline: classify → score → cascade → mitigate</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Scenario presets */}
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Select Scenario</div>
          {PRESET_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.name}
              onClick={() => setSelectedScenario(idx)}
              className="w-full text-left rounded-xl p-3 transition-all duration-200"
              style={{
                background: selectedScenario === idx ? `${sc.color}10` : '#0f172a',
                border: `1px solid ${selectedScenario === idx ? sc.color : '#1e293b'}`,
                boxShadow: selectedScenario === idx ? `0 0 20px ${sc.color}20` : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{sc.icon}</span>
                <span className="text-xs font-semibold text-white">{sc.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">{sc.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold"
                  style={{ background: `${sc.color}20`, color: sc.color }}
                >
                  {sc.eventType}
                </span>
                <span className="text-[9px] text-slate-500">Severity: <span className="text-orange-400">{sc.severity}/10</span></span>
              </div>
            </button>
          ))}

          {/* Affected supplier */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Affected Supplier (Hit Node)</div>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg outline-none"
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  Tier {s.tier} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom description */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Custom Event Description (optional)</div>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Describe a custom scenario..."
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60"
            style={{
              background: isRunning
                ? '#334155'
                : `linear-gradient(135deg, ${PRESET_SCENARIOS[selectedScenario].color}, ${PRESET_SCENARIOS[selectedScenario].color}80)`,
              color: 'white',
              boxShadow: isRunning ? 'none' : `0 0 30px ${PRESET_SCENARIOS[selectedScenario].color}40`,
            }}
          >
            {isRunning ? (
              <InlineLoader label="Running full pipeline..." />
            ) : (
              <>⚡ Run Simulation</>
            )}
          </button>

          {/* Run history */}
          {runHistory.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Recent Runs</div>
              <div className="space-y-1.5">
                {runHistory.map((run, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[10px]"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                  >
                    <div>
                      <span className="text-slate-300 font-medium">{run.name}</span>
                      <span className="text-slate-600 ml-2">{run.at}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{run.time}ms</span>
                      <span
                        className="font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: getRiskColor(run.impact / 10),
                          background: `${getRiskColor(run.impact / 10)}15`,
                        }}
                      >
                        {run.impact.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Center: Graph ─── */}
      <div className="flex-1 relative">
        {isRunning && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            style={{ background: 'rgba(8,15,26,0.85)', backdropFilter: 'blur(4px)' }}
          >
            <LoadingSpinner size="lg" label="Classifying → Scoring → Cascading → Mitigating..." />
            <div className="mt-4 text-xs text-slate-500">Full AI pipeline running...</div>
          </div>
        )}
        <ErrorBoundary>
          <SupplyChainGraph
            suppliers={suppliers}
            cascadePath={cascadePath}
            onNodeClick={() => {}}
          />
        </ErrorBoundary>

        {/* Response time badge */}
        {responseTime && !isRunning && (
          <div
            className="absolute bottom-4 left-4 rounded-xl px-3 py-2 text-xs animate-fade-in"
            style={{ background: 'rgba(8,15,26,0.95)', border: '1px solid #1e293b', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-slate-500">Pipeline completed in </span>
            <span className="font-bold text-emerald-400">{responseTime}ms</span>
            {usedMockData && <span className="text-yellow-400 ml-2">(mock data)</span>}
          </div>
        )}
      </div>

      {/* ─── Right: Results panel ─── */}
      <div
        className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid #1e293b' }}
      >
        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid #1e293b' }}>
          <h2 className="text-sm font-bold text-white">Simulation Results</h2>
          {result && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-sm font-bold"
                style={{ color: getRiskColor(result.totalImpact / 10) }}
              >
                {result.totalImpact.toFixed(1)}/10
              </span>
              <span className="text-[10px] text-slate-500">Total Impact Score</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!result && !isRunning ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-sm font-medium text-slate-500">Run a simulation to see results</p>
              <p className="text-xs text-slate-600 mt-1">Select a scenario and hit Run</p>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-fade-in">
              {/* Briefing summary */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="text-xs font-semibold text-red-400 mb-2">📋 Impact Summary</div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.briefingSummary}</p>
              </div>

              {/* Affected suppliers */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Affected Nodes ({result.affectedSuppliers.length})</div>
                <div className="space-y-2">
                  {result.affectedSuppliers.map((aff, idx) => (
                    <div
                      key={aff.supplier.id}
                      className="rounded-lg p-3"
                      style={{ background: '#0f172a', border: `1px solid ${getRiskColor(aff.newRiskScore)}30` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                            style={{ background: getRiskColor(aff.newRiskScore), color: 'white' }}
                          >
                            {idx}
                          </span>
                          <span className="text-xs font-medium text-white">{aff.supplier.name}</span>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: getRiskColor(aff.newRiskScore) }}>
                          {(aff.newRiskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{aff.reasoning}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px]">
                        <span className="text-slate-500">
                          Risk: <span className="font-bold" style={{ color: getRiskColor(aff.newRiskScore) }}>{(aff.newRiskScore * 100).toFixed(0)}%</span>
                        </span>
                        <span className="text-slate-500">
                          Impact: <span className="font-bold text-white">{aff.newImpactScore.toFixed(1)}/10</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mitigations */}
              {result.mitigations.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">🛡 Auto-Generated Mitigations</div>
                  {result.mitigations.map((m) => (
                    <ErrorBoundary key={m.id}>
                      <MitigationCard strategy={m} />
                    </ErrorBoundary>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
