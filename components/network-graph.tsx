"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import type { NetworkNode, NetworkEdge } from "@/types"
import { InteractiveNetworkGraph } from "./interactive-graph"

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

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)

  return (
    <Card className="border-border bg-card shadow-sm h-full flex flex-col">
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
      <CardContent className="flex-1 min-h-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
          {/* Graph */}
          <div className="relative rounded-xl border border-border bg-muted/30 p-0 lg:col-span-2 overflow-hidden h-[400px] lg:h-auto">
             <InteractiveNetworkGraph 
                nodes={nodes} 
                edges={edges} 
                onNodeClick={setSelectedNode} 
             />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] lg:max-h-full">
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
                  Drag and Zoom using controls to inspect the network.
                </p>
              </div>
            )}

            <div className="mt-auto pt-4">
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
