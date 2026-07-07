'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Supplier } from '@/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getRiskColor, RISK_CATEGORIES } from '@/types';

const SupplyChainGraph = dynamic(() => import('@/components/graph/SupplyChainGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner size="lg" label="Loading graph..." />
    </div>
  ),
});

export default function AdminPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSuppliers(d.data); })
      .finally(() => setIsLoading(false));
  }, []);

  const handleNodeClick = (s: Supplier) => {
    setSelected(s);
    setEditForm({ ...s });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.map((s) => s.id === data.data.id ? data.data : s));
        setSelected(data.data);
        setIsEditing(false);
        setSaveMsg('Saved successfully');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <LoadingSpinner size="lg" label="Loading admin view..." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left: Graph */}
      <div className="flex-1 relative">
        <div
          className="absolute top-4 left-4 z-10 rounded-xl px-3 py-2 text-xs"
          style={{ background: 'rgba(8,15,26,0.95)', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-yellow-400 font-medium">⚙ Admin Mode</span>
          <span className="text-slate-500 ml-2">Drag nodes to reposition · Click to edit</span>
        </div>
        <ErrorBoundary>
          <SupplyChainGraph
            suppliers={suppliers}
            onNodeClick={handleNodeClick}
            isAdmin={true}
          />
        </ErrorBoundary>
      </div>

      {/* Right: Edit panel */}
      <div
        className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid #1e293b', background: '#0c1628' }}
      >
        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid #1e293b' }}>
          <h2 className="text-sm font-bold text-white">Supplier Editor</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Click a node on the graph to select and edit</p>
        </div>

        {!selected ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-600">
            <div className="text-4xl mb-3">⬡</div>
            <p className="text-xs">Select a supplier node</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{selected.name}</div>
                <div
                  className="text-[10px] font-medium mt-0.5"
                  style={{ color: getRiskColor(selected.currentRiskScore) }}
                >
                  Risk: {(selected.currentRiskScore * 100).toFixed(0)}% · Impact: {selected.currentImpactScore.toFixed(1)}/10
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ background: isEditing ? '#334155' : '#1e293b', color: isEditing ? '#e2e8f0' : '#94a3b8', border: '1px solid #334155' }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {saveMsg && (
              <div className="text-xs text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-2 animate-fade-in border border-emerald-400/20">
                ✓ {saveMsg}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-3">
              {[
                { label: 'Name', field: 'name' as keyof Supplier, type: 'text' },
                { label: 'Country', field: 'country' as keyof Supplier, type: 'text' },
                { label: 'Region', field: 'region' as keyof Supplier, type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
                  <input
                    type={type}
                    disabled={!isEditing}
                    value={String(editForm[field] ?? '')}
                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full text-xs px-3 py-2 rounded-lg outline-none transition-colors"
                    style={{
                      background: isEditing ? '#1e293b' : '#0f172a',
                      border: `1px solid ${isEditing ? '#475569' : '#1e293b'}`,
                      color: isEditing ? '#e2e8f0' : '#64748b',
                    }}
                  />
                </div>
              ))}

              {/* Tier */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Tier</label>
                <select
                  disabled={!isEditing}
                  value={editForm.tier ?? selected.tier}
                  onChange={(e) => setEditForm((f) => ({ ...f, tier: parseInt(e.target.value) }))}
                  className="w-full text-xs px-3 py-2 rounded-lg outline-none"
                  style={{ background: isEditing ? '#1e293b' : '#0f172a', border: `1px solid ${isEditing ? '#475569' : '#1e293b'}`, color: '#e2e8f0' }}
                >
                  <option value={1}>Tier 1 — Assembly</option>
                  <option value={2}>Tier 2 — Components</option>
                  <option value={3}>Tier 3 — Raw Materials</option>
                </select>
              </div>

              {/* Risk sliders */}
              {[
                { label: 'Risk Score', field: 'currentRiskScore' as keyof Supplier, min: 0, max: 1, step: 0.01 },
                { label: 'Impact Score', field: 'currentImpactScore' as keyof Supplier, min: 0, max: 10, step: 0.1 },
              ].map(({ label, field, min, max, step }) => (
                <div key={field}>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</label>
                    <span className="text-[10px] font-bold" style={{ color: getRiskColor(selected.currentRiskScore) }}>
                      {Number(editForm[field] ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    disabled={!isEditing}
                    value={Number(editForm[field] ?? 0)}
                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: parseFloat(e.target.value) }))}
                    className="w-full h-1 rounded-full appearance-none"
                    style={{ accentColor: getRiskColor(selected.currentRiskScore) }}
                  />
                </div>
              ))}

              {/* Risk category exposure */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">Risk Exposure Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {RISK_CATEGORIES.map((cat) => {
                    const isActive = (editForm.categoryExposure ?? []).includes(cat);
                    return (
                      <button
                        key={cat}
                        disabled={!isEditing}
                        onClick={() => {
                          if (!isEditing) return;
                          const current = editForm.categoryExposure ?? [];
                          setEditForm((f) => ({
                            ...f,
                            categoryExposure: isActive
                              ? current.filter((c) => c !== cat)
                              : [...current, cat],
                          }));
                        }}
                        className="text-[9px] px-2 py-1 rounded uppercase tracking-wide transition-all"
                        style={{
                          background: isActive ? 'rgba(14,165,233,0.2)' : '#1e293b',
                          border: `1px solid ${isActive ? '#0ea5e9' : '#334155'}`,
                          color: isActive ? '#38bdf8' : '#64748b',
                          cursor: isEditing ? 'pointer' : 'default',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  disabled={!isEditing}
                  value={String(editForm.description ?? '')}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none transition-colors"
                  style={{
                    background: isEditing ? '#1e293b' : '#0f172a',
                    border: `1px solid ${isEditing ? '#475569' : '#1e293b'}`,
                    color: isEditing ? '#e2e8f0' : '#64748b',
                  }}
                />
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white' }}
              >
                {isSaving ? 'Saving...' : '💾 Save Changes'}
              </button>
            )}

            {/* Meta info */}
            <div className="text-[10px] text-slate-600 space-y-1 pt-2 border-t border-slate-800">
              <div>ID: <span className="font-mono">{selected.id}</span></div>
              <div>Upstream: {selected.upstreamIds.length} suppliers</div>
              <div>Downstream: {selected.downstreamIds.length} suppliers</div>
              <div>Updated: {new Date(selected.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
