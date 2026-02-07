"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import type { NetworkNode, NetworkEdge } from "@/types"

interface NetworkGraphProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

function riskFill(level: string) {
  switch (level) {
    case "CRITICAL":
      return "hsl(var(--sentinel-critical))"
    case "ELEVATED":
      return "hsl(var(--sentinel-elevated))"
    default:
      return "hsl(var(--sentinel-healthy))"
  }
}

function edgeStroke(type: string) {
  switch (type) {
    case "mentorship":
      return "hsl(var(--sentinel-info))"
    case "blocking":
      return "hsl(var(--sentinel-critical))"
    default:
      return "hsl(var(--muted-foreground))"
  }
}

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Team Network Graph</CardTitle>
          <div className="flex items-center gap-4">
            {[
              { label: "Low", var: "--sentinel-healthy" },
              { label: "Elevated", var: "--sentinel-elevated" },
              { label: "Critical", var: "--sentinel-critical" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: `hsl(var(${item.var}))` }}
                />
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Graph */}
          <div className="relative rounded-xl border border-border bg-muted/30 p-3 lg:col-span-2">
            <svg viewBox="0 0 600 420" className="h-auto w-full" role="img" aria-label="Network graph visualization">
              {/* Edges */}
              {edges.map((edge, i) => {
                const source = nodeMap.get(edge.source)
                const target = nodeMap.get(edge.target)
                if (!source || !target) return null
                const highlighted = hoveredNode === edge.source || hoveredNode === edge.target
                return (
                  <line
                    key={`edge-${i}`}
                    x1={source.x || 0}
                    y1={source.y || 0}
                    x2={target.x || 0}
                    y2={target.y || 0}
                    stroke={edgeStroke(edge.edge_type)}
                    strokeWidth={highlighted ? 2.5 : 1.5}
                    strokeOpacity={highlighted ? 0.6 : 0.15}
                    strokeDasharray={edge.edge_type === "blocking" ? "5 3" : "none"}
                    className="transition-opacity duration-200"
                  />
                )
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const r = 14 + (node.betweenness || 0) * 18
                const isHovered = hoveredNode === node.id
                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x || 0}
                      cy={node.y || 0}
                      r={r}
                      fill={riskFill(node.risk_level)}
                      fillOpacity={isHovered ? 0.9 : 0.75}
                      stroke={isHovered ? "hsl(var(--foreground))" : "hsl(var(--card))"}
                      strokeWidth={2}
                      className="transition-all duration-200"
                    />
                    {node.is_hidden_gem && (
                      <text
                        x={node.x || 0}
                        y={(node.y || 0) - r - 6}
                        textAnchor="middle"
                        fill="hsl(var(--sentinel-elevated))"
                        fontSize={14}
                        fontWeight="bold"
                      >
                        {"*"}
                      </text>
                    )}
                    <text
                      x={node.x || 0}
                      y={(node.y || 0) + r + 16}
                      textAnchor="middle"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      {node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Node Details
            </p>
            {selectedNode ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: riskFill(selectedNode.risk_level) }}
                  />
                  <span className="font-mono text-sm font-semibold text-foreground">{selectedNode.label}</span>
                  {selectedNode.is_hidden_gem && (
                    <Badge
                      variant="outline"
                      className="border-[hsl(var(--sentinel-elevated))]/20 bg-[hsl(var(--sentinel-elevated))]/6 text-[10px] text-[hsl(var(--sentinel-elevated))]"
                    >
                      <Sparkles className="mr-1 h-2.5 w-2.5" />
                      Hidden Gem
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Risk Level", value: selectedNode.risk_level },
                    { label: "Betweenness", value: (selectedNode.betweenness || 0).toFixed(2) },
                    { label: "Eigenvector", value: (selectedNode.eigenvector || 0).toFixed(2) },
                    { label: "Unblocking", value: selectedNode.unblocking_count || 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedNode.is_hidden_gem && (
                  <div className="rounded-lg border border-[hsl(var(--sentinel-elevated))]/15 bg-[hsl(var(--sentinel-elevated))]/4 p-4">
                    <p className="text-xs font-semibold text-foreground">Talent Scout Alert</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      High betweenness centrality ({(selectedNode.betweenness || 0).toFixed(2)}) with{" "}
                      {selectedNode.unblocking_count || 0} unblocking events. Critical connector bridging
                      disconnected groups.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">Click a node to view details</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Node size reflects betweenness centrality
                </p>
              </div>
            )}

            <div className="mt-auto">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Edge Types
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-0.5 w-5 rounded bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Collaboration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-0.5 w-5 rounded bg-[hsl(var(--sentinel-info))]" />
                  <span className="text-xs text-muted-foreground">Mentorship</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 border-t border-dashed border-[hsl(var(--sentinel-critical))]" />
                  <span className="text-xs text-muted-foreground">Blocking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
