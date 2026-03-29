"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Network, TrendingUp, Sparkles, Brain, Zap, Target } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NetworkGraph } from "@/components/network-graph"
import { SkillsRadar } from "@/components/skills-radar"
import { ForecastChart } from "@/components/forecast-chart"
import { NudgeCard } from "@/components/nudge-card"

// Using existing types or create locally if needed
import { Employee, NetworkNode, NetworkEdge, NudgeData } from "@/types"

interface ManagerOverviewProps {
  employees: Employee[]
  networkNodes: NetworkNode[]
  networkEdges: NetworkEdge[]
  forecastData: any[]
  nudgeData: NudgeData | null
  skillsData?: any 
}

export function ManagerOverview({
  employees,
  networkNodes,
  networkEdges,
  forecastData,
  nudgeData,
  skillsData = []
}: ManagerOverviewProps) {
  
  // Aggregate stats
  const stats = useMemo(() => {
    const total = employees.length
    const critical = employees.filter(e => e.risk_level === 'CRITICAL').length
    const velocity = employees.reduce((acc, curr) => acc + (curr.velocity || 0), 0) / (total || 1)
    return { total, critical, velocity }
  }, [employees])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Skill Graph & Network (Combined View) */}
      <Card className="col-span-2 lg:col-span-2 row-span-2 border-primary/20 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                 <Network className="h-5 w-5" /> Team Skill & Network Topology
              </CardTitle>
              <CardDescription>Live collaboration patterns and skill clusters</CardDescription>
           </div>
           <div className="flex gap-2">
               <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{networkNodes.length} Nodes</Badge>
               <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{networkEdges.length} Connections</Badge>
           </div>
        </CardHeader>
        <CardContent className="h-[500px] relative overflow-hidden rounded-xl bg-[#020617] border border-border m-6 mt-0">
           {/* Background Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
           
           <NetworkGraph 
              nodes={networkNodes} 
              edges={networkEdges} 
              // TODO: Add skill filtering prop if network graph supports it
           />
           
           {/* Overlay Skill Radar (Mini) - Absolute positioned for composite view */}
           <div className="absolute bottom-4 right-4 w-[200px] h-[200px] bg-card/80 backdrop-blur-md rounded-lg border border-border p-2 pointer-events-none">
              <div className="text-[10px] text-center text-muted-foreground font-mono mb-1">AGGREGATE SKILLS</div>
              <SkillsRadar data={skillsData} height={160} />
           </div>
        </CardContent>
      </Card>

      {/* 2. Burnout Prediction */}
      <Card className="border-pink-500/20 bg-card">
        <CardHeader className="pb-2">
           <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-400">
              <TrendingUp className="h-4 w-4" /> Burnout Forecast (30 Days)
           </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 h-[200px]">
           <ForecastChart data={forecastData as any} />
        </CardContent>
      </Card>

      {/* 3. Actionable AI Insights */}
      <Card className="border-purple-500/20 bg-card">
        <CardHeader className="pb-2">
           <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-400">
              <Sparkles className="h-4 w-4" /> Sentinel Recommendation
           </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
           {nudgeData ? (
             <NudgeCard nudge={nudgeData} />
           ) : (
             <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground text-sm">
               <Brain className="h-8 w-8 mb-2 opacity-20" />
               Processing team patterns...
             </div>
           )}
        </CardContent>
      </Card>
      
      {/* 4. Team Velocity & Centrality Summary */}
      <div className="grid grid-cols-2 gap-4">
         <Card className="border-blue-500/20 bg-card">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
               <Zap className="h-6 w-6 text-blue-400 mb-2" />
               <div className="text-2xl font-bold font-mono text-blue-200">{stats.velocity.toFixed(1)}</div>
               <div className="text-[10px] text-blue-400/70 uppercase tracking-wider">Avg Velocity</div>
            </CardContent>
         </Card>
         <Card className="border-emerald-500/20 bg-card">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
               <Target className="h-6 w-6 text-emerald-400 mb-2" />
               <div className="text-2xl font-bold font-mono text-emerald-200">{(stats.total - stats.critical)}/{stats.total}</div>
               <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Healthy Ratio</div>
            </CardContent>
         </Card>
      </div>

    </div>
  )
}
