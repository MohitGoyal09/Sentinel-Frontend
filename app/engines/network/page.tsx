"use client"

import { useState, useMemo } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NetworkGraph } from "@/components/network-graph"
import {
  Network,
  Users,
  Share2,
  MessageCircle,
  Link2,
  Target,
  AlertCircle,
  TrendingUp,
  Circle,
  GitBranch,
  Clock,
  RefreshCw,
  Info,
  Zap,
  Layers,
  Crosshair,
  Unplug,
  Gauge,
  Activity,
  Play,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import { useGlobalNetworkData } from "@/hooks/useGlobalNetworkData"
import { NetworkNode } from "@/types"
import { toast } from "sonner"
import { cn, getInitials } from "@/lib/utils"

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-card border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

// ─── Network Content ──────────────────────────────────────────────────────────

function NetworkContent() {
  const { data: networkData, isLoading, refetch } = useGlobalNetworkData()

  const networkNodes = networkData?.nodes ?? []
  const networkEdges = networkData?.edges ?? []

  // Derive connectivity metrics from real data
  const connectivityMetrics = useMemo(() => {
    const nodeCount = networkNodes.length
    const edgeCount = networkEdges.length
    if (nodeCount === 0) return null

    const maxEdges = nodeCount * (nodeCount - 1) / 2
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0

    const degreeMap: Record<string, number> = {}
    networkEdges.forEach(e => {
      const src = typeof e.source === "string" ? e.source : (e.source as any)?.id ?? ""
      const tgt = typeof e.target === "string" ? e.target : (e.target as any)?.id ?? ""
      degreeMap[src] = (degreeMap[src] ?? 0) + 1
      degreeMap[tgt] = (degreeMap[tgt] ?? 0) + 1
    })
    const avgDegree = nodeCount > 0
      ? Object.values(degreeMap).reduce((a, b) => a + b, 0) / nodeCount
      : 0
    const avgBetweenness = networkNodes.reduce((a, n) => a + (n.betweenness ?? 0), 0) / nodeCount
    const avgClustering = Math.max(0, Math.min(1, 1 - avgBetweenness))
    const diameter = avgDegree > 0 ? Math.max(2, Math.round(Math.log(nodeCount) / Math.log(avgDegree))) : 3
    const isolated = networkNodes.filter(n => !degreeMap[n.id]).length

    return {
      density,
      avgClustering,
      diameter,
      totalEdges: edgeCount,
      avgDegree: avgDegree.toFixed(1),
      isolated,
    }
  }, [networkNodes, networkEdges])

  // Key influencers: top nodes by betweenness
  const keyInfluencers = useMemo(() => {
    return [...networkNodes]
      .filter(n => n.betweenness != null)
      .sort((a, b) => (b.betweenness ?? 0) - (a.betweenness ?? 0))
      .slice(0, 8)
      .map(n => ({
        id: n.id,
        name: n.label || n.id,
        connections: networkEdges.filter(e => {
          const src = typeof e.source === "string" ? e.source : (e.source as any)?.id ?? ""
          const tgt = typeof e.target === "string" ? e.target : (e.target as any)?.id ?? ""
          return src === n.id || tgt === n.id
        }).length,
        centrality: Math.round((n.betweenness ?? 0) * 100),
        influence: Math.round((n.eigenvector ?? n.betweenness ?? 0) * 100),
        is_hidden_gem: n.is_hidden_gem ?? false,
      }))
  }, [networkNodes, networkEdges])

  // Isolation alerts: nodes with very few connections
  const isolationAlerts = useMemo(() => {
    const degreeMap: Record<string, number> = {}
    networkEdges.forEach(e => {
      const src = typeof e.source === "string" ? e.source : (e.source as any)?.id ?? ""
      const tgt = typeof e.target === "string" ? e.target : (e.target as any)?.id ?? ""
      degreeMap[src] = (degreeMap[src] ?? 0) + 1
      degreeMap[tgt] = (degreeMap[tgt] ?? 0) + 1
    })
    return networkNodes
      .filter(n => (degreeMap[n.id] ?? 0) <= 2)
      .slice(0, 6)
      .map(n => ({
        id: n.id,
        name: n.label || n.id,
        connections: degreeMap[n.id] ?? 0,
        risk: ((degreeMap[n.id] ?? 0) === 0
          ? "critical"
          : (degreeMap[n.id] ?? 0) <= 1
          ? "high"
          : "medium") as "critical" | "high" | "medium",
      }))
  }, [networkNodes, networkEdges])

  const isolatedCount = connectivityMetrics?.isolated ?? 0
  const bridgeNodes = networkNodes.filter(n => (n.betweenness ?? 0) > 0.1).length

  const riskColorClass = (risk: string) => {
    if (risk === "critical") return "text-destructive"
    if (risk === "high") return "text-[hsl(var(--sentinel-elevated))]"
    return "text-muted-foreground"
  }

  const riskBgClass = (risk: string) => {
    if (risk === "critical") return "bg-destructive/10 border border-destructive/15"
    if (risk === "high") return "bg-[hsl(var(--sentinel-elevated))]/10 border border-[hsl(var(--sentinel-elevated))]/15"
    return "bg-white/5 border border-white/5"
  }

  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-col gap-5 p-4 lg:p-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--sentinel-info))]/15 border border-[hsl(var(--sentinel-info))]/20 flex items-center justify-center shrink-0">
              <Network className="h-5 w-5 text-[hsl(var(--sentinel-info))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Manrope',sans-serif] text-foreground">Network Engine</h1>
              <p className="text-sm text-muted-foreground">Team connectivity &amp; communication analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground bg-white/5 border border-white/5 rounded-full px-3 py-1">
              Last analyzed 1 hour ago
            </span>
            <Badge className="gap-1 text-[10px] bg-accent/10 text-accent border border-accent/20">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run Analysis
            </Button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-white/10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* ── Stats Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Network Density"
                value={connectivityMetrics ? `${(connectivityMetrics.density * 100).toFixed(0)}%` : "--"}
                sub="Graph connectivity ratio"
                icon={Gauge}
                color="text-[hsl(var(--sentinel-info))]"
              />
              <StatCard
                label="Avg Connections"
                value={connectivityMetrics?.avgDegree ?? "--"}
                sub="Connections per member"
                icon={Link2}
                color="text-primary"
              />
              <StatCard
                label="Isolated Members"
                value={isolatedCount}
                sub="Require intervention"
                icon={Unplug}
                color={isolatedCount > 0 ? "text-destructive" : "text-accent"}
              />
              <StatCard
                label="Bridge Nodes"
                value={bridgeNodes}
                sub="High centrality connectors"
                icon={GitBranch}
                color="text-accent"
              />
            </div>

            {/* ── Main Content ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

              {/* Network Graph */}
              <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Network className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                    Network Graph
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Normal
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-gem))]" />
                      Hidden Gem
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      At-Risk
                    </span>
                  </div>
                </div>
                <div className="h-[500px]">
                  {networkNodes.length > 0 ? (
                    <NetworkGraph nodes={networkNodes} edges={networkEdges} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Network className="h-12 w-12 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">No network data available yet</p>
                      <p className="text-[11px] text-muted-foreground">Network will appear as team data grows</p>
                    </div>
                  )}
                </div>
                {/* Graph summary bar */}
                {connectivityMetrics && (
                  <div className="flex items-center gap-6 px-4 py-3 border-t border-white/5 text-[11px] text-muted-foreground">
                    <span>{networkNodes.length} nodes</span>
                    <span className="h-3 border-l border-border" />
                    <span>{connectivityMetrics.totalEdges} edges</span>
                    <span className="h-3 border-l border-border" />
                    <span>Clustering: {(connectivityMetrics.avgClustering * 100).toFixed(0)}%</span>
                    <span className="h-3 border-l border-border" />
                    <span>Diameter: {connectivityMetrics.diameter}</span>
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-5">

                {/* Key Influencers */}
                <div className="bg-card border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                    Key Influencers
                  </h3>
                  {keyInfluencers.length > 0 ? (
                    <div className="space-y-3">
                      {keyInfluencers.map((c, idx) => (
                        <div key={c.id} className="flex items-center gap-3">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                            idx === 0 ? "bg-[hsl(var(--sentinel-gem))]" : idx <= 2 ? "bg-primary" : "bg-muted-foreground/50"
                          )}>
                            {idx + 1}
                          </div>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn(
                              "text-[10px]",
                              c.is_hidden_gem ? "bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))]" : "bg-primary/10 text-primary"
                            )}>
                              {getInitials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <p className="text-xs font-medium truncate text-foreground">{c.name}</p>
                              {idx === 0 && (
                                <Zap className="h-3 w-3 text-[hsl(var(--sentinel-gem))] shrink-0" />
                              )}
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[hsl(var(--sentinel-info))] rounded-full transition-all duration-500"
                                style={{ width: `${c.centrality}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[hsl(var(--sentinel-info))] shrink-0">{c.centrality}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 gap-2">
                      <Target className="h-6 w-6 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground">No influencer data yet</p>
                    </div>
                  )}
                </div>

                {/* Isolation Alerts */}
                <div className="bg-card border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Unplug className="h-4 w-4 text-destructive" />
                    Isolation Alerts
                    {isolationAlerts.length > 0 && (
                      <Badge className="text-[9px] bg-destructive/15 text-destructive border-destructive/20 ml-1">
                        {isolationAlerts.length}
                      </Badge>
                    )}
                  </h3>
                  {isolationAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {isolationAlerts.map((member) => (
                        <div
                          key={member.id}
                          className={cn("rounded-lg p-3 flex items-center gap-3", riskBgClass(member.risk))}
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[9px] bg-muted">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                              {member.risk === "critical" && (
                                <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                              )}
                            </div>
                            <p className={cn("text-[10px]", riskColorClass(member.risk))}>
                              {member.connections} connection{member.connections !== 1 ? "s" : ""}
                              {member.risk === "critical" ? " — isolated" : " — low connectivity"}
                            </p>
                          </div>
                          <button
                            className="shrink-0 text-[10px] border border-white/10 rounded px-2 py-1 text-muted-foreground hover:text-foreground hover:border-white/20 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
                            onClick={() => {
                              const q = encodeURIComponent('How should I support this team member?')
                              window.location.href = `/ask-sentinel?q=${q}`
                            }}
                          >
                            Intervene
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 gap-2">
                      <Activity className="h-6 w-6 text-accent/30" />
                      <p className="text-xs text-accent">No isolated members detected</p>
                    </div>
                  )}
                </div>

                {/* Network Metrics */}
                <div className="bg-card border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Network Metrics
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Graph Density",
                        value: connectivityMetrics ? (connectivityMetrics.density * 100).toFixed(0) : 0,
                        display: connectivityMetrics ? `${(connectivityMetrics.density * 100).toFixed(0)}%` : "--",
                        color: "bg-[hsl(var(--sentinel-info))]",
                      },
                      {
                        label: "Avg Clustering",
                        value: connectivityMetrics ? connectivityMetrics.avgClustering * 100 : 0,
                        display: connectivityMetrics ? `${(connectivityMetrics.avgClustering * 100).toFixed(0)}%` : "--",
                        color: "bg-primary",
                      },
                      {
                        label: "Bridge Nodes",
                        value: networkNodes.length > 0 ? Math.min((bridgeNodes / networkNodes.length) * 100, 100) : 0,
                        display: `${bridgeNodes}`,
                        color: "bg-accent",
                      },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{m.label}</span>
                          <span className="text-xs font-mono text-foreground">{m.display}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", m.color)}
                            style={{ width: `${m.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Info className="h-3 w-3" />Refreshed every 5 minutes</span>
              <span className="h-3 border-l border-border" />
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </>
        )}
      </main>
    </ScrollArea>
  )
}

export default function NetworkEnginePage() {
  return <NetworkContent />
}
