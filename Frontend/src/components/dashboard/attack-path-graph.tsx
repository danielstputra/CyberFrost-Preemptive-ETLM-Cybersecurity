'use client';

import { useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, MarkerType, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', type: 'input', position: { x: 0, y: 50 }, data: { label: '🌐 Phishing Domain' }, style: attackNodeStyle('#FF003C') },
  { id: '2', position: { x: 250, y: 0 }, data: { label: '🔓 Credential Leak' }, style: attackNodeStyle('#FCEE09') },
  { id: '3', position: { x: 250, y: 100 }, data: { label: '🔑 VPN Access' }, style: attackNodeStyle('#FCEE09') },
  { id: '4', position: { x: 500, y: 50 }, data: { label: '🖥️ Target Server' }, style: attackNodeStyle('#FF003C') },
  { id: '5', position: { x: 750, y: 50 }, data: { label: '💾 Data Exfil' }, style: attackNodeStyle('#FF003C') },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#00F6FF', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00F6FF' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#00F6FF', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00F6FF' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#FCEE09', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#FCEE09' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#FCEE09', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#FCEE09' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#FF003C', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#FF003C' } },
];

function attackNodeStyle(color: string): React.CSSProperties {
  return {
    background: `rgba(11,15,20,0.95)`,
    border: `1px solid ${color}`,
    color: '#fff',
    padding: '10px 16px',
    borderRadius: 0,
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: 11,
    boxShadow: `0 0 10px ${color}33`,
    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
  };
}

export function AttackPathGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-64 sm:h-80 border border-[rgba(0,246,255,0.15)]" style={{ background: 'rgba(5,5,10,0.9)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.5}
        maxZoom={2}
        panOnDrag
        zoomOnScroll={false}
      >
        <Background color="rgba(0,246,255,0.04)" gap={20} />
        <Controls showInteractive={false} className="[&>button]:bg-[#0B0F14] [&>button]:border [&>button]:border-[rgba(255,255,255,0.08)] [&>button]:text-white" />
      </ReactFlow>
    </div>
  );
}
