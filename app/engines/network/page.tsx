"use client"

import { useState, useMemo } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  TrendingDown,
  Circle,
  Webhook,
  GitBranch,
  Clock,
  RefreshCw,
  Info,
  Zap,
  Layers,
  Crosshair,
  Unplug,
  Gauge,
  Activity
} from "lucide-react"

interface Connector {
  id: string
  name: string
  role: string
  connections: number
  influence: number
  avatar: string
}

interface Cluster {
  id: string
  name: string
  members: number
  density: number
  color: string
}

interface SiloMember {
  id: string
  name: string
  role: string
  connections: number
  risk: "high" | "medium" | "low"
}

function NetworkContent() {
  const [activeTab, setActiveTab] = useState<"overview" | "connectors" | "patterns" | "silos">("overview")

  const networkNodes = useMemo(() => {
    const names = [
      "Sarah Chen", "Mike Johnson", "Emily Davis", "Alex Kim", "Jordan Lee",
      "Taylor Swift", "Chris Martin", "Pat Riley", "Sam Wilson", "Jamie Oliver",
      "Riley Cooper", "Morgan Freeman", "Casey Jones", "Quinn Hughes", "Drew Barrymore",
      "Skyler White", "Avery Brown", "Reese Witherspoon", "Charlie Puth", "Harper Lee"
    ]
    const roles = ["Engineer", "Designer", "Manager", "Analyst", "Lead", "Director"]
    const riskLevels = ["LOW", "LOW", "LOW", "ELEVATED", "CRITICAL"] as const

    return names.map((name, idx) => ({
      id: `node-${idx}`,
      label: name,
      risk_level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      betweenness: Math.random() * 0.5,
      eigenvector: Math.random() * 0.8,
      unblocking_count: Math.floor(Math.random() * 10),
      is_hidden_gem: idx < 3
    }))
  }, [])

  const networkEdges = useMemo(() => {
    const edges: { source: string; target: string; weight: number; edge_type: string }[] = []
    
    for (let i = 0; i < networkNodes.length; i++) {
      const connections = Math.floor(Math.random() * 4) + 1
      for (let j = 0; j < connections; j++) {
        const targetIdx = Math.floor(Math.random() * networkNodes.length)
        if (targetIdx !== i) {
          edges.push({
            source: `node-${i}`,
            target: `node-${targetIdx}`,
            weight: Math.random() * 3 + 1,
            edge_type: ["collaboration", "mentorship", "reporting"][Math.floor(Math.random() * 3)]
          })
        }
      }
    }
    return edges
  }, [networkNodes])

  const connectivityMetrics = useMemo(() => {
    return {
      density: 0.65 + Math.random() * 0.25,
      avgClustering: 0.55 + Math.random() * 0.3,
      diameter: Math.floor(Math.random() * 3) + 2,
      components: Math.floor(Math.random() * 2) + 1,
      totalEdges: networkEdges.length,
      avgDegree: (networkEdges.length * 2 / networkNodes.length).toFixed(1)
    }
  }, [networkNodes, networkEdges])

  const keyConnectors = useMemo((): Connector[] => {
    const connectors: Connector[] = [
      { id: "1", name: "Sarah Chen", role: "Tech Lead", connections: 45, influence: 92, avatar: "SC" },
      { id: "2", name: "Mike Johnson", role: "Engineering Manager", connections: 38, influence: 88, avatar: "MJ" },
      { id: "3", name: "Emily Davis", role: "Senior Architect", connections: 42, influence: 85, avatar: "ED" },
      { id: "4", name: "Alex Kim", role: "Product Manager", connections: 35, influence: 78, avatar: "AK" },
      { id: "5", name: "Jordan Lee", role: "Team Lead", connections: 31, influence: 72, avatar: "JL" }
    ]
    return connectors
  }, [])

  const clusters = useMemo((): Cluster[] => {
    return [
      { id: "1", name: "Engineering Core", members: 8, density: 0.78, color: "cyan" },
      { id: "2", name: "Product Team", members: 5, density: 0.85, color: "blue" },
      { id: "3", name: "Design Hub", members: 4, density: 0.72, color: "indigo" },
      { id: "4", name: "Operations", members: 3, density: 0.65, color: "purple" }
    ]
  }, [])

  const communicationPatterns = useMemo(() => {
    return [
      { type: "Cross-team Collaboration", frequency: 42, trend: 8, color: "cyan" },
      { type: "Within Team", frequency: 35, trend: -3, color: "blue" },
      { type: "Management Cascade", frequency: 15, trend: 2, color: "indigo" },
      { type: "External Partners", frequency: 8, trend: 5, color: "purple" }
    ]
  }, [])

  const siloMembers = useMemo((): SiloMember[] => {
    return [
      { id: "1", name: "Riley Cooper", role: "Data Analyst", connections: 3, risk: "high" },
      { id: "2", name: "Morgan Freeman", role: "QA Lead", connections: 4, risk: "high" },
      { id: "3", name: "Casey Jones", role: "Backend Dev", connections: 5, risk: "medium" },
      { id: "4", name: "Quinn Hughes", role: "Support Lead", connections: 6, risk: "medium" },
      { id: "5", name: "Drew Barrymore", role: "Content Writer", connections: 7, risk: "low" }
    ]
  }, [])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "hsl(var(--sentinel-critical))"
      case "medium": return "hsl(var(--sentinel-elevated))"
      default: return "hsl(var(--sentinel-healthy))"
    }
  }

  const getClusterBarColor = (color: string) => {
    switch (color) {
      case "cyan": return "hsl(var(--sentinel-info))"
      case "blue": return "hsl(var(--primary))"
      case "indigo": return "hsl(var(--primary))"
      default: return "hsl(var(--primary))"
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-8 p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-info))]/15 border border-[hsl(var(--sentinel-info))]/20">
                <Network className="h-6 w-6 text-[hsl(var(--sentinel-info))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Network Engine</h2>
                <p className="text-sm text-muted-foreground">Team connectivity & communication analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px] border-[hsl(var(--sentinel-healthy))]/30 text-[hsl(var(--sentinel-healthy))] bg-[hsl(var(--sentinel-healthy))]/10">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="glass-card-elevated relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[hsl(var(--sentinel-info))]/3" />
            
            <div className="relative grid gap-10 p-8 md:grid-cols-2 lg:gap-14">
              {/* Network Density Gauge */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--sentinel-info))]/10 blur-3xl" />
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {(connectivityMetrics.density * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                        Network Density
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-medium text-white bg-[hsl(var(--sentinel-info))]">
                    {connectivityMetrics.density > 0.7 ? "Strong" : connectivityMetrics.density > 0.5 ? "Healthy" : "Developing"}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                  <span className="text-sm font-medium text-[hsl(var(--sentinel-info))]">{connectivityMetrics.totalEdges} active connections</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col justify-center gap-4">
                {/* Avg Clustering */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-info))]/10">
                      <Layers className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Avg. Clustering</p>
                      <p className="text-[11px] text-muted-foreground">Team cohesion</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-info))]">{(connectivityMetrics.avgClustering * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">Coefficient</p>
                  </div>
                </div>

                {/* Network Diameter */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                      <Crosshair className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Network Diameter</p>
                      <p className="text-[11px] text-muted-foreground">Max hops between</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{connectivityMetrics.diameter}</p>
                    <p className="text-[10px] text-muted-foreground">degrees</p>
                  </div>
                </div>

                {/* Components */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                      <GitBranch className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Connected Groups</p>
                      <p className="text-[11px] text-muted-foreground">Network components</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{connectivityMetrics.components}</p>
                    <p className="text-[10px] text-muted-foreground">components</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-border">
            {(["overview", "connectors", "patterns", "silos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[hsl(var(--primary))] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "overview" && <Gauge className="h-4 w-4" />}
                {tab === "connectors" && <Target className="h-4 w-4" />}
                {tab === "patterns" && <MessageCircle className="h-4 w-4" />}
                {tab === "silos" && <Unplug className="h-4 w-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Network Graph */}
              <div className="h-[500px] glass-card rounded-2xl overflow-hidden">
                <NetworkGraph nodes={networkNodes} edges={networkEdges} />
              </div>

              {/* Network Metrics */}
              <div className="grid gap-4 lg:grid-cols-4">
                {[
                  { label: "Total Connections", value: connectivityMetrics.totalEdges, subtitle: "edges in network", icon: Link2 },
                  { label: "Avg. Degree", value: connectivityMetrics.avgDegree, subtitle: "connections per person", icon: Users },
                  { label: "Clustering Coefficient", value: connectivityMetrics.avgClustering.toFixed(2), subtitle: "0-1 scale", icon: Zap },
                  { label: "Network Diameter", value: connectivityMetrics.diameter, subtitle: "max degrees of separation", icon: Circle }
                ].map((metric, idx) => (
                  <div key={metric.label} className="metric-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                      <span className="text-xs font-medium">{metric.label}</span>
                    </div>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{metric.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* Clusters */}
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-5 w-5 text-[hsl(var(--sentinel-info))]" />
                    Team Clusters
                  </CardTitle>
                  <CardDescription>Identified groups within the organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {clusters.map((cluster) => (
                      <div key={cluster.id} className="metric-card rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: getClusterBarColor(cluster.color) }}>
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cluster.name}</p>
                            <p className="text-[10px] text-muted-foreground">{cluster.members} members</p>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xl font-bold font-mono tabular-nums text-foreground">{(cluster.density * 100).toFixed(0)}%</p>
                            <p className="text-[10px] text-muted-foreground">Density</p>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getClusterBarColor(cluster.color) }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {/* Key Connectors Tab */}
          {activeTab === "connectors" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-[hsl(var(--sentinel-info))]" />
                    Key Connectors & Influencers
                  </CardTitle>
                  <CardDescription>Team members who bridge groups and drive collaboration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {keyConnectors.map((connector, idx) => (
                      <div 
                        key={connector.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white font-bold text-sm font-mono tabular-nums">
                          {idx + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-semibold">
                            {connector.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{connector.name}</p>
                            {connector.influence >= 85 && (
                              <Badge variant="outline" className="text-[9px] border-[hsl(var(--sentinel-gem))]/30 text-[hsl(var(--sentinel-gem))] bg-[hsl(var(--sentinel-gem))]/10">
                                <Zap className="h-2.5 w-2.5 mr-1" />
                                Top Influencer
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{connector.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{connector.connections}</p>
                          <p className="text-[10px] text-muted-foreground">connections</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono tabular-nums text-[hsl(var(--sentinel-info))]">{connector.influence}%</p>
                          <p className="text-[10px] text-muted-foreground">influence</p>
                        </div>
                        <div className="w-24">
                          <Progress value={connector.influence} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Hidden Gems */}
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-5 w-5 text-[hsl(var(--sentinel-gem))]" />
                    Hidden Gems
                  </CardTitle>
                  <CardDescription>High-potential connectors with significant network impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    {networkNodes.filter(n => n.is_hidden_gem).slice(0, 3).map((node) => (
                      <div key={node.id} className="metric-card rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))] text-xs">
                              {node.label.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{node.label}</p>
                            <p className="text-[10px] text-muted-foreground">Hidden Gem</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground">Betweenness</p>
                            <p className="text-xs font-semibold font-mono tabular-nums text-[hsl(var(--sentinel-gem))]">{(node.betweenness || 0).toFixed(3)}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground">Unblocking</p>
                            <p className="text-xs font-semibold font-mono tabular-nums text-[hsl(var(--primary))]">{node.unblocking_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {/* Communication Patterns Tab */}
          {activeTab === "patterns" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-5 w-5 text-[hsl(var(--sentinel-info))]" />
                    Communication Patterns
                  </CardTitle>
                  <CardDescription>How information flows through the organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {communicationPatterns.map((pattern, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getClusterBarColor(pattern.color) }} />
                            <span className="text-sm font-medium">{pattern.type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold font-mono tabular-nums text-foreground">{pattern.frequency}%</span>
                            <div className={`flex items-center gap-1 text-[10px] ${pattern.trend >= 0 ? 'text-[hsl(var(--sentinel-healthy))]' : 'text-[hsl(var(--sentinel-critical))]'}`}>
                              {pattern.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(pattern.trend)}%
                            </div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pattern.frequency}%`, backgroundColor: getClusterBarColor(pattern.color) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Communication Flow */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Webhook className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                      Information Flow Direction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { direction: "Top-Down", percentage: 45, color: "hsl(var(--sentinel-info))" },
                        { direction: "Bottom-Up", percentage: 25, color: "hsl(var(--primary))" },
                        { direction: "Horizontal", percentage: 30, color: "hsl(var(--primary))" }
                      ].map((flow, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{flow.direction}</span>
                            <span className="text-sm font-medium font-mono tabular-nums">{flow.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ width: `${flow.percentage}%`, backgroundColor: flow.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
                      Peak Communication Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { time: "Morning (9-11 AM)", activity: 85, label: "Peak" },
                        { time: "Mid-day (11 AM-2 PM)", activity: 65, label: "Moderate" },
                        { time: "Afternoon (2-5 PM)", activity: 75, label: "High" },
                        { time: "Evening (5-7 PM)", activity: 35, label: "Low" }
                      ].map((period, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{period.time}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              period.activity >= 75 ? "bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]" : "bg-muted text-muted-foreground"
                            }`}>
                              {period.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[hsl(var(--sentinel-info))] rounded-full"
                                style={{ width: `${period.activity}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium font-mono tabular-nums text-[hsl(var(--sentinel-info))] w-8">{period.activity}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>
            </div>
          )}

          {/* Silos Tab */}
          {activeTab === "silos" && (
            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="glass-card rounded-2xl border border-[hsl(var(--sentinel-critical))]/20 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                    <AlertCircle className="h-5 w-5 text-[hsl(var(--sentinel-critical))]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[hsl(var(--sentinel-critical))]">Potential Silos Detected</h3>
                    <p className="text-[11px] text-muted-foreground">5 team members have limited network connections</p>
                  </div>
                </div>
              </div>

              {/* Isolated Members List */}
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Unplug className="h-5 w-5 text-[hsl(var(--sentinel-info))]" />
                    Isolated Team Members
                  </CardTitle>
                  <CardDescription>Members with limited connections who may benefit from more collaboration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {siloMembers.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{member.name}</p>
                            {member.risk === "high" && (
                              <Badge className="text-[9px] bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                High Risk
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono tabular-nums text-foreground">{member.connections}</p>
                          <p className="text-[10px] text-muted-foreground">connections</p>
                        </div>
                        <div className="w-20">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(member.connections / 10) * 100}%`,
                                backgroundColor: getRiskColor(member.risk)
                              }}
                            />
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors">
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Recommendations */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { title: "Cross-functional Projects", desc: "Assign isolated members to cross-team initiatives", icon: "🤝" },
                        { title: "Mentorship Program", desc: "Pair with well-connected team members", icon: "👥" },
                        { title: "Team Lunches", desc: "Create informal connection opportunities", icon: "🍽️" },
                        { title: "Knowledge Sessions", desc: "Encourage sharing expertise across teams", icon: "📚" }
                      ].map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                          <span className="text-lg">{rec.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{rec.title}</p>
                            <p className="text-[11px] text-muted-foreground">{rec.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                      Connection Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { from: "Riley Cooper", to: "Sarah Chen", reason: "Similar project interests" },
                        { from: "Morgan Freeman", to: "Mike Johnson", reason: "Same department" },
                        { from: "Casey Jones", to: "Emily Davis", reason: "Technical complement" }
                      ].map((suggestion, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                          <div className="flex-1 text-right">
                            <p className="text-sm font-medium">{suggestion.from}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-2">
                            <div className="h-px w-6 bg-border" />
                            <Share2 className="h-3.5 w-3.5 text-[hsl(var(--sentinel-info))]" />
                            <div className="h-px w-6 bg-border" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.to}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground w-28">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              <span>Data refreshed every 5 minutes</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </main>
      </ScrollArea>
    </div>
  )
}

export default function NetworkEnginePage() {
  return (
    <ProtectedRoute>
      <NetworkContent />
    </ProtectedRoute>
  )
}
