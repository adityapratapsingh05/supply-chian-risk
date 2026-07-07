'use client';

import { useState } from 'react';
import type { ExecutiveBriefing } from '@/types';
import { getRiskColor } from '@/types';
import { LoadingSpinner, InlineLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const RISK_LEVEL_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  IMMEDIATE: '#ef4444',
  SHORT_TERM: '#f97316',
  LONG_TERM: '#22c55e',
};

const TREND_ICONS: Record<string, string> = {
  DETERIORATING: '↓',
  STABLE: '→',
  IMPROVING: '↑',
};

const TREND_COLORS: Record<string, string> = {
  DETERIORATING: '#ef4444',
  STABLE: '#eab308',
  IMPROVING: '#22c55e',
};

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedMockData, setUsedMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/briefing', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBriefing(data.data);
        if (data.usedMockData) setUsedMockData(true);
      } else {
        setError(data.error ?? 'Generation failed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!briefing) return;
    const md = generateMarkdown(briefing);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-briefing-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!briefing) return;
    // Dynamically import jspdf + html2canvas to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const element = document.getElementById('briefing-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#080f1a',
      scale: 2,
      useCORS: true,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`supply-chain-briefing-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Header controls */}
      <div
        className="flex-shrink-0 px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e293b' }}
      >
        <div>
          <h1 className="text-lg font-bold text-white">Executive Briefing</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-generated C-suite supply chain risk report</p>
        </div>
        <div className="flex items-center gap-3">
          {usedMockData && (
            <span className="text-[10px] px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              Mock Data
            </span>
          )}
          {briefing && (
            <>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
              >
                ↓ Markdown
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
              >
                ↓ PDF
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{
              background: isGenerating ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              color: 'white',
              boxShadow: isGenerating ? 'none' : '0 0 30px rgba(14,165,233,0.3)',
            }}
          >
            {isGenerating ? <InlineLoader label="Generating briefing..." /> : '📋 Generate Briefing'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {error && (
          <div className="max-w-4xl mx-auto mb-4 rounded-xl p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20">
            Error: {error}
          </div>
        )}

        {!briefing && !isGenerating && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600">
            <div className="text-6xl mb-6 opacity-30">📋</div>
            <h2 className="text-xl font-semibold text-slate-400 mb-2">No Briefing Generated</h2>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
              Generate an AI-powered executive briefing that summarizes current supply chain risk, top threats, and recommended actions.
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: 'white' }}
            >
              Generate First Briefing
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" label="Analyzing supply chain data and generating briefing..." />
          </div>
        )}

        {briefing && !isGenerating && (
          <ErrorBoundary>
            <div id="briefing-content" className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              {/* Header card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, ${RISK_LEVEL_COLORS[briefing.overallRiskLevel] ?? '#0ea5e9'}15, #1e293b)`,
                  border: `1px solid ${RISK_LEVEL_COLORS[briefing.overallRiskLevel] ?? '#0ea5e9'}40`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Supply Chain Risk Intelligence Brief</div>
                    <div className="text-xl font-bold text-white">Smartphone OEM · Global Operations</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {new Date(briefing.generatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-black mb-1"
                      style={{ color: RISK_LEVEL_COLORS[briefing.overallRiskLevel] }}
                    >
                      {briefing.overallRiskLevel}
                    </div>
                    <div className="text-sm text-slate-500">
                      Score: <span className="font-bold text-white">{briefing.overallRiskScore.toFixed(1)}/10</span>
                    </div>
                    <div
                      className="text-sm font-semibold mt-1"
                      style={{ color: TREND_COLORS[briefing.riskTrend] }}
                    >
                      {TREND_ICONS[briefing.riskTrend]} {briefing.riskTrend}
                    </div>
                  </div>
                </div>

                {/* Risk score meter */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${briefing.overallRiskScore * 10}%`,
                      background: `linear-gradient(90deg, ${RISK_LEVEL_COLORS[briefing.overallRiskLevel]}, ${RISK_LEVEL_COLORS[briefing.overallRiskLevel]}80)`,
                    }}
                  />
                </div>
              </div>

              {/* Executive Summary */}
              <div className="rounded-xl p-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Executive Summary</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{briefing.executiveSummary}</p>
              </div>

              {/* Top 3 Threats */}
              <div>
                <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Top 3 Threats</h2>
                <div className="space-y-3">
                  {briefing.topThreats.map((threat) => (
                    <div
                      key={threat.rank}
                      className="rounded-xl p-5"
                      style={{
                        background: '#1e293b',
                        border: `1px solid ${getRiskColor(threat.probability)}30`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                          style={{ background: `${getRiskColor(threat.probability)}20`, color: getRiskColor(threat.probability) }}
                        >
                          {threat.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{threat.supplierName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Tier supplier</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-3 leading-relaxed">{threat.threat}</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <div className="text-[10px] text-slate-500 mb-1">Disruption Probability</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${threat.probability * 100}%`, backgroundColor: getRiskColor(threat.probability) }}
                                  />
                                </div>
                                <span className="text-xs font-bold" style={{ color: getRiskColor(threat.probability) }}>
                                  {(threat.probability * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 mb-1">Business Impact</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${threat.impact * 10}%`, backgroundColor: getRiskColor(threat.probability) }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-white">{threat.impact.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className="rounded-lg p-3 text-xs"
                            style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)' }}
                          >
                            <span className="text-sky-400 font-semibold">Recommendation: </span>
                            <span className="text-slate-300">{threat.recommendation}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cascade Impact Summary */}
              <div className="rounded-xl p-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Cascade Impact Analysis</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{briefing.cascadeImpactSummary}</p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Recommended Actions</h2>
                <div className="space-y-3">
                  {briefing.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-4 flex items-start gap-4"
                      style={{ background: '#1e293b', border: '1px solid #334155' }}
                    >
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0 mt-0.5"
                        style={{ background: `${PRIORITY_COLORS[action.priority]}20`, color: PRIORITY_COLORS[action.priority], border: `1px solid ${PRIORITY_COLORS[action.priority]}40` }}
                      >
                        {action.priority.replace('_', ' ')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white mb-1">{action.action}</div>
                        <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                          <span>Owner: <span className="text-slate-300">{action.owner}</span></span>
                          <span>Deadline: <span className="text-slate-300">{action.deadline}</span></span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          <span className="text-emerald-400">Expected: </span>{action.expectedOutcome}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                className="rounded-xl p-4 flex items-center justify-between text-xs"
                style={{ background: '#0f172a', border: '1px solid #1e293b' }}
              >
                <div className="text-slate-600">
                  Generated by Supply Chain Risk Monitor AI · {new Date(briefing.generatedAt).toLocaleString()}
                </div>
                <div className="text-slate-600">
                  Next review: <span className="text-slate-400">{briefing.nextReviewDate}</span>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

function generateMarkdown(briefing: ExecutiveBriefing): string {
  return `# Supply Chain Risk Intelligence Brief
**Organization:** Smartphone OEM · Global Operations  
**Generated:** ${new Date(briefing.generatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  
**Overall Risk Level:** ${briefing.overallRiskLevel} (${briefing.overallRiskScore.toFixed(1)}/10)  
**Trend:** ${briefing.riskTrend}

---

## Executive Summary

${briefing.executiveSummary}

---

## Top 3 Threats

${briefing.topThreats.map((t) => `### ${t.rank}. ${t.supplierName}
**Threat:** ${t.threat}  
**Disruption Probability:** ${(t.probability * 100).toFixed(0)}%  
**Business Impact:** ${t.impact.toFixed(1)}/10  
**Recommendation:** ${t.recommendation}
`).join('\n')}

---

## Cascade Impact Analysis

${briefing.cascadeImpactSummary}

---

## Recommended Actions

${briefing.recommendedActions.map((a, i) => `### ${i + 1}. ${a.action}
- **Priority:** ${a.priority.replace('_', ' ')}
- **Owner:** ${a.owner}
- **Deadline:** ${a.deadline}
- **Expected Outcome:** ${a.expectedOutcome}
`).join('\n')}

---

*Next Review Date: ${briefing.nextReviewDate}*  
*Generated by Supply Chain Risk Monitor AI*
`;
}
