'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SupplierNode } from './SupplierNode';
import type { Supplier } from '@/types';
import { getRiskColor } from '@/types';

const nodeTypes = { supplierNode: SupplierNode };

interface SupplyChainGraphProps {
  suppliers: Supplier[];
  cascadePath?: string[];
  onNodeClick?: (supplier: Supplier) => void;
  isAdmin?: boolean;
}

// Compute stable node positions based on tier
function computeLayout(suppliers: Supplier[]): Record<string, { x: number; y: number }> {
  const byTier: Record<number, Supplier[]> = {};
  for (const s of suppliers) {
    if (!byTier[s.tier]) byTier[s.tier] = [];
    byTier[s.tier].push(s);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const tierY: Record<number, number> = { 3: 60, 2: 310, 1: 560 };
  const NODE_WIDTH = 240;
  const PADDING = 60;

  for (const [tierStr, nodes] of Object.entries(byTier)) {
    const tier = parseInt(tierStr);
    const totalWidth = nodes.length * NODE_WIDTH + (nodes.length - 1) * PADDING;
    const startX = (1000 - totalWidth) / 2;
    nodes.forEach((node, idx) => {
      positions[node.id] = {
        x: startX + idx * (NODE_WIDTH + PADDING),
        y: tierY[tier] ?? 400,
      };
    });
  }
  return positions;
}

function buildNodes(
  suppliers: Supplier[],
  positions: Record<string, { x: number; y: number }>,
  cascadePath: string[],
  onNodeClick: ((s: Supplier) => void) | undefined,
  isAdmin: boolean
): Node[] {
  return suppliers.map((s) => ({
    id: s.id,
    type: 'supplierNode',
    position: positions[s.id] ?? { x: 0, y: 0 },
    data: {
      ...s,
      isHighlighted: cascadePath.includes(s.id),
      cascadeOrder: cascadePath.indexOf(s.id),
      onClick: onNodeClick,
    },
    draggable: isAdmin,
  }));
}

function buildEdges(suppliers: Supplier[], cascadePath: string[]): Edge[] {
  const edges: Edge[] = [];
  for (const s of suppliers) {
    for (const downstreamId of s.downstreamIds) {
      const fromIdx = cascadePath.indexOf(s.id);
      const toIdx = cascadePath.indexOf(downstreamId);
      const isActiveCascade =
        fromIdx !== -1 && toIdx !== -1 && Math.abs(fromIdx - toIdx) === 1;

      edges.push({
        id: `${s.id}->${downstreamId}`,
        source: s.id,
        target: downstreamId,
        type: 'smoothstep',
        animated: isActiveCascade,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActiveCascade ? '#ef4444' : '#475569',
          width: 15,
          height: 15,
        },
        style: {
          stroke: isActiveCascade ? '#ef4444' : '#475569',
          strokeWidth: isActiveCascade ? 3 : 1.5,
          filter: isActiveCascade ? 'drop-shadow(0 0 6px #ef4444)' : undefined,
        },
        label: isActiveCascade ? '⚠ CASCADE' : undefined,
        labelStyle: { fill: '#ef4444', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
      });
    }
  }
  return edges;
}

export default function SupplyChainGraph({
  suppliers,
  cascadePath = [],
  onNodeClick,
  isAdmin = false,
}: SupplyChainGraphProps) {
  // Stable positions computed once per suppliers identity change
  const positions = useMemo(() => computeLayout(suppliers), [suppliers]);

  // Build initial arrays — used only on first mount and when supplier list changes
  const [nodes, setNodes, onNodesChange] = useNodesState(() =>
    buildNodes(suppliers, positions, cascadePath, onNodeClick, isAdmin)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(() =>
    buildEdges(suppliers, cascadePath)
  );

  // Track previous supplier IDs so we only reset when the actual list changes
  const prevSupplierIds = useRef<string>('');
  const supplierIds = suppliers.map((s) => s.id).join(',');

  useEffect(() => {
    if (prevSupplierIds.current !== supplierIds) {
      prevSupplierIds.current = supplierIds;
      setNodes(buildNodes(suppliers, positions, cascadePath, onNodeClick, isAdmin));
      setEdges(buildEdges(suppliers, cascadePath));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierIds]);

  // Only update node highlight/cascade state (not positions) when cascadePath changes
  const prevCascade = useRef<string>('');
  const cascadeKey = cascadePath.join(',');
  useEffect(() => {
    if (prevCascade.current === cascadeKey) return;
    prevCascade.current = cascadeKey;

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: cascadePath.includes(n.id),
          cascadeOrder: cascadePath.indexOf(n.id),
          onClick: onNodeClick,
        },
      }))
    );
    setEdges(buildEdges(suppliers, cascadePath));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cascadeKey]);

  // Update onNodeClick callback inside node data without triggering full resets
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, onClick: onNodeClickRef.current },
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — ref stays fresh

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...params, type: 'smoothstep', animated: false, style: { stroke: '#475569', strokeWidth: 1.5 } },
          eds
        )
      );
    },
    [setEdges]
  );

  return (
    <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: '#080f1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isAdmin ? onNodesChange : undefined}
        onEdgesChange={isAdmin ? onEdgesChange : undefined}
        onConnect={isAdmin ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isAdmin}
        nodesConnectable={isAdmin}
        elementsSelectable={isAdmin}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
        <Controls
          style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
        />
        <MiniMap
          nodeColor={(node) => {
            const supplier = suppliers.find((s) => s.id === node.id);
            return supplier ? getRiskColor(supplier.currentRiskScore) : '#475569';
          }}
          style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
          maskColor="rgba(0,0,0,0.6)"
        />

        {/* Legend */}
        <div
          className="absolute top-4 right-4 z-10 rounded-xl p-3"
          style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">Risk Level</div>
          {[
            { label: 'Critical', color: '#ef4444' },
            { label: 'High', color: '#f97316' },
            { label: 'Medium', color: '#eab308' },
            { label: 'Low', color: '#22c55e' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
          {cascadePath.length > 0 && (
            <>
              <div className="border-t border-slate-700 my-2" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400">Cascade Path</span>
              </div>
            </>
          )}
        </div>

        {/* Tier labels */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-32 pointer-events-none">
          {[
            { label: 'Tier 3', sublabel: 'Raw Materials' },
            { label: 'Tier 2', sublabel: 'Components' },
            { label: 'Tier 1', sublabel: 'Assembly' },
          ].map(({ label, sublabel }) => (
            <div key={label} className="text-left">
              <div className="text-xs font-bold text-slate-300">{label}</div>
              <div className="text-[10px] text-slate-500">{sublabel}</div>
            </div>
          ))}
        </div>
      </ReactFlow>
    </div>
  );
}
