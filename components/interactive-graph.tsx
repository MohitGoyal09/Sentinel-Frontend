"use client"

import { useCallback, useEffect, useMemo } from "react"
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import type { NetworkNode, NetworkEdge } from "@/types"

// --- Custom Node Implementation ---
const RiskNode = ({ data }: any) => {
  const { label, risk_level, is_hidden_gem, betweenness } = data

  const riskFill = (level: string) => {
    switch (level) {
      case "CRITICAL": return "hsl(var(--sentinel-critical))"
      case "ELEVATED": return "hsl(var(--sentinel-elevated))"
      default: return "hsl(var(--sentinel-healthy))"
    }
  }

  // Visual Enhancement: Larger Nodes based on influence
  // Base 24px + scaling factor. Makes "Important" nodes stand out more.
  const r = 24 + (betweenness || 0) * 30
  const size = r * 2

  return (
    <div className="relative flex items-center justify-center">
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      
      <div 
        style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: riskFill(risk_level),
            borderColor: "hsl(var(--card))",
            borderWidth: "3px",
        }}
        className="flex items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 opacity-95 hover:opacity-100"
      >
        {is_hidden_gem && (
            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--sentinel-elevated))] text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
              ★
            </div>
        )}
      </div>

      <div 
        className="absolute top-full mt-2 px-2 py-0.5 rounded-md bg-background/90 text-xs font-mono text-foreground font-medium whitespace-nowrap backdrop-blur-sm border border-border shadow-sm"
        style={{ transform: 'translateY(4px)' }}
      >
        {label}
      </div>
    </div>
  )
}

const nodeTypes = {
  riskNode: RiskNode,
}

// --- Main Component ---
interface InteractiveNetworkGraphProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  onNodeClick?: (node: NetworkNode) => void
}

export function InteractiveNetworkGraph({ nodes, edges, onNodeClick }: InteractiveNetworkGraphProps) {
  
  // Calculate initial nodes with updated size logic
  const initialNodes = useMemo(() => nodes.map((n) => {
    // Must match the radius calculation in RiskNode for proper centering
    const r = 24 + (n.betweenness || 0) * 30
    return {
      id: n.id,
      type: 'riskNode',
      // Center based on new size
      position: { x: (n.x || 0) - r, y: (n.y || 0) - r },
      data: { ...n },
    }
  }), [nodes])

  // Calculate initial edges with improved visibility
  const initialEdges = useMemo(() => edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    type: 'default',
    animated: e.edge_type === 'mentorship', // Only animate flow of knowledge (mentorship)
    style: {
      stroke: e.edge_type === 'blocking' ? 'hsl(var(--sentinel-critical))' : 
              e.edge_type === 'mentorship' ? 'hsl(var(--sentinel-info))' : 
              'hsl(var(--muted-foreground))',
      strokeWidth: e.edge_type === 'collaboration' ? 2 : 3, // Thicker lines
      strokeDasharray: e.edge_type === 'blocking' ? '5,5' : 'none',
      opacity: 0.7,
    },
    // Optional: Add markers for direction if needed
    // markerEnd: { type: MarkerType.ArrowClosed },
  })), [edges])

  const [rfNodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const handleCallbackClick = useCallback((event: React.MouseEvent, node: Node) => {
     if (onNodeClick) onNodeClick(node.data as NetworkNode)
  }, [onNodeClick])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleCallbackClick}
        fitView
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-right"
      >
        <Background color="#888" gap={20} size={1} style={{ opacity: 0.15 }} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
