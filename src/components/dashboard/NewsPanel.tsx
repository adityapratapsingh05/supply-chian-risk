'use client';

import { useState } from 'react';
import type { NewsArticle } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'geo-political': '#f97316',
  'climate': '#22c55e',
  'logistics': '#38bdf8',
  'regulatory': '#a78bfa',
  'labor': '#fbbf24',
  'cyber': '#ef4444',
  'financial': '#ec4899',
  'pandemic/health': '#06b6d4',
  'trade policy': '#84cc16',
  'natural disaster': '#fb923c',
};

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Minimal', 2: 'Low', 3: 'Low', 4: 'Moderate', 5: 'Moderate',
  6: 'Elevated', 7: 'High', 8: 'Severe', 9: 'Critical', 10: 'Extreme',
};

interface NewsPanelProps {
  articles: NewsArticle[];
  onIngest?: () => void;
  isIngesting?: boolean;
  usedMockData?: boolean;
}

export function NewsPanel({ articles, onIngest, isIngesting, usedMockData }: NewsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(articles.map((a) => a.classifiedCategory).filter(Boolean)))];

  const filtered = selectedCategory === 'all'
    ? articles
    : articles.filter((a) => a.classifiedCategory === selectedCategory);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Risk News Feed</h3>
          {usedMockData && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              Mock Data
            </span>
          )}
        </div>
        <button
          onClick={onIngest}
          disabled={isIngesting}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
          style={{ background: isIngesting ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white' }}
        >
          {isIngesting ? (
            <>
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {categories.slice(0, 6).map((cat) => {
          const color = CATEGORY_COLORS[cat] ?? '#6b7280';
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide transition-all duration-150"
              style={{
                backgroundColor: isActive ? `${color}25` : 'transparent',
                color: isActive ? color : '#64748b',
                border: `1px solid ${isActive ? color : '#334155'}`,
              }}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          );
        })}
      </div>

      {/* Articles list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-xs">No articles. Click Refresh to ingest.</p>
          </div>
        ) : (
          filtered.map((article) => {
            const catColor = CATEGORY_COLORS[article.classifiedCategory] ?? '#6b7280';
            const isExpanded = expanded === article.id;

            return (
              <div
                key={article.id}
                className="rounded-lg p-3 cursor-pointer transition-all duration-150 hover:border-slate-600 animate-slide-in"
                style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                onClick={() => setExpanded(isExpanded ? null : article.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                  >
                    {article.classifiedCategory || 'unclassified'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: article.severity >= 8 ? '#ef444420' : article.severity >= 6 ? '#f9731620' : '#eab30820',
                        color: article.severity >= 8 ? '#ef4444' : article.severity >= 6 ? '#f97316' : '#eab308',
                      }}
                    >
                      {SEVERITY_LABELS[article.severity] ?? 'Unknown'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-snug mb-1.5 line-clamp-2">
                  {article.title}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span>{article.source}</span>
                  {article.affectedGeography && (
                    <>
                      <span>·</span>
                      <span>{article.affectedGeography}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>

                {isExpanded && article.rawContent && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400 leading-relaxed">{article.rawContent.substring(0, 300)}...</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
