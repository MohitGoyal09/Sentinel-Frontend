"use client"

import { useMemo, useState } from "react"
import {
  Shield, AlertTriangle, Activity, Zap, Users, CheckCircle2, TrendingUp, RefreshCw, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Employee } from "@/types"
import { cn } from "@/lib/utils"
// Assuming RiskAssessment uses gauge style from screenshot
import { RiskAssessment } from "@/components/risk-assessment"

interface SafetyValveProps {
  employees: Employee[]
  selectedUser: Employee | null
  onSelectUser: (user: Employee) => void
  activeTab?: string
}

export function SafetyValve({ employees, selectedUser, onSelectUser }: SafetyValveProps) {
  const [analysisRunning, setAnalysisRunning] = useState(false)

  const handleRunAnalysis = async () => {
    setAnalysisRunning(true)
    toast.info("Re-analyzing team data...")
    try {
      // Reload the page to refetch all employee data from the backend
      window.location.reload()
    } catch {
      toast.error("Analysis failed. Please try again.")
      setAnalysisRunning(false)
    }
  }

  // Aggregate Metrics based on screenshot logic
  const metrics = useMemo(() => {
    const total = employees.length
    const healthy = employees.filter(e => e.risk_level === "LOW").length
    const elevated = employees.filter(e => e.risk_level === "ELEVATED").length
    const critical = employees.filter(e => e.risk_level === "CRITICAL").length
    const avgVelocity = (employees.reduce((acc, e) => acc + (e.velocity || 0), 0) / (total || 1)).toFixed(2)
    
    // Contagion Risk: consider both critical and elevated counts relative to team size
    const contagionRisk = (critical >= 2 || (elevated >= 3 && critical >= 1)) ? "ELEVATED" : "LOW"
    
    return { total, healthy, elevated, critical, avgVelocity, contagionRisk }
  }, [employees])

  const riskPercent = metrics.total > 0 ? Math.round((metrics.critical / metrics.total) * 100) : 0

  // Generate context-aware AI recommendation from the selected employee's actual data
  const aiRecommendation = useMemo(() => {
    if (!selectedUser) return "No active warnings."

    if (selectedUser.risk_level === "CRITICAL") {
      return "Multiple risk signals are converging. Immediate 1:1 recommended."
    }

    const signals: string[] = []

    if (selectedUser.velocity > 2.5) {
      signals.push("Work intensity is significantly elevated. Consider reviewing current workload distribution.")
    }
    if (selectedUser.belongingness_score < 0.4) {
      signals.push("Social engagement has declined. A casual check-in may help.")
    }
    if (selectedUser.circadian_entropy > 1.5) {
      signals.push("Work schedule has become irregular. Discuss schedule flexibility.")
    }

    if (signals.length === 0) {
      return "All signals within healthy range. No action needed."
    }

    return signals.join(" ")
  }, [selectedUser])

  // Current risk state for the Burnout Risk Banner
  const criticalRiskEmployees = useMemo(() => employees.filter(e => e.risk_level === "CRITICAL").slice(0, 3), [employees])
  const elevatedRiskEmployees = useMemo(() => employees.filter(e => e.risk_level === "ELEVATED").slice(0, 3), [employees])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ─── Top Stats Section (Hero + 3 Cards) ───────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Hero Card: Overall Risk Score */}
        <Card className="lg:col-span-2 relative overflow-hidden bg-slate-900 border-border">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-64 h-64 text-emerald-500" />
          </div>
          <CardContent className="p-8 flex flex-col items-center justify-center h-[280px] relative z-10">
            <div className="relative mb-6">
              {/* Circular Gauge Placeholder */}
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800/50" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (riskPercent / 100))} className="text-emerald-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-100 tracking-tighter">{riskPercent}</span>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mt-1">Risk Score</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
               <CheckCircle2 className="w-4 h-4" />
               <span className="text-sm font-medium">Team health is good</span>
            </div>
          </CardContent>
        </Card>

        {/* 3 Stacked Metric Cards (Right Side) */}
        <div className="space-y-4">
            {/* Critical Card */}
            <Card className="bg-red-950/20 border-red-500/20 hover:border-red-500/40 transition-colors">
               <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle className="w-6 h-6" /></div>
                     <div>
                        <div className="text-lg font-bold text-red-400">Critical</div>
                        <div className="text-xs text-red-400/60">Immediate attention required</div>
                     </div>
                  </div>
                  <div className="text-3xl font-bold text-red-500">{metrics.critical}</div>
               </CardContent>
            </Card>

            {/* Elevated Card */}
            <Card className="bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40 transition-colors">
               <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><Activity className="w-6 h-6" /></div>
                     <div>
                        <div className="text-lg font-bold text-amber-400">Elevated</div>
                        <div className="text-xs text-amber-400/60">Monitoring closely</div>
                     </div>
                  </div>
                  <div className="text-3xl font-bold text-amber-500">{metrics.elevated}</div>
               </CardContent>
            </Card>

            {/* Healthy Card */}
            <Card className="bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
               <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
                     <div>
                        <div className="text-lg font-bold text-emerald-400">Healthy</div>
                        <div className="text-xs text-emerald-400/60">Within normal range</div>
                     </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-500">{metrics.healthy}</div>
               </CardContent>
            </Card>
        </div>
      </div>

      {/* ─── Burnout Prediction Banner ─────────────────────────────────── */}
      <Card className="bg-[#1a0a0a] border-red-500/20 overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>
         <CardHeader className="pb-2 border-b border-red-500/10 bg-red-950/20">
            <div className="flex items-center gap-2 text-red-400">
               <AlertCircle className="w-5 h-5" />
               <CardTitle className="text-base">Burnout Prediction</CardTitle>
            </div>
            <CardDescription className="text-red-300/60 text-xs">Current risk assessment based on behavioral patterns</CardDescription>
         </CardHeader>
         <CardContent className="p-6 grid md:grid-cols-3 gap-8">
            <div className="space-y-3 border-r border-red-500/10 pr-4">
               <div className="flex items-center justify-between text-xs font-medium text-red-400 uppercase tracking-wider">
                  Critical Risk
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               </div>
               <div className="text-xs text-red-300/70 mb-2">Employees currently at critical burnout risk</div>
               {criticalRiskEmployees.length > 0 ? (
                  criticalRiskEmployees.map(e => (
                     <div key={e.user_hash} className="flex items-center gap-2 text-red-200 text-sm bg-red-500/10 px-2 py-1.5 rounded-md border border-red-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {e.name}
                     </div>
                  ))
               ) : (
                  <div className="text-xs text-red-400/50 italic">No critical risk employees</div>
               )}
            </div>
            
            <div className="space-y-3 border-r border-red-500/10 pr-4">
               <div className="flex items-center justify-between text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Elevated Risk
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               </div>
               <div className="text-xs text-amber-300/70 mb-2">Employees currently showing elevated risk signals</div>
               <div className="space-y-1">
                  {elevatedRiskEmployees.map(e => (
                     <div key={e.user_hash} className="flex items-center gap-2 text-amber-200 text-sm">
                        <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                        {e.name}
                     </div>
                  ))}
                  {elevatedRiskEmployees.length === 0 && (
                     <div className="text-xs text-amber-400/50 italic">No elevated risk employees</div>
                  )}
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Prevention Actions
                  <CheckCircle2 className="w-3.5 h-3.5" />
               </div>
               <div className="text-xs text-emerald-300/70 mb-2">Recommended interventions based on current patterns</div>
               <ul className="space-y-2 text-sm text-emerald-200/80">
                  <li className="flex items-start gap-2">
                     <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500" />
                     Schedule mandatory breaks for high velocity employees
                  </li>
                  <li className="flex items-start gap-2">
                     <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500" />
                     Review workload distribution across the team
                  </li>
               </ul>
            </div>
         </CardContent>
      </Card>

      {/* ─── Detailed Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         {[
            { label: "Total Members", value: metrics.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Healthy", value: `${Math.round((metrics.healthy / metrics.total || 0) * 100)}%`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: `${metrics.healthy} members` },
            { label: "Elevated", value: metrics.elevated, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10", sub: "Monitoring" },
            { label: "Critical", value: metrics.critical, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", sub: "Immediate" },
            { label: "Avg Velocity", value: metrics.avgVelocity, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", sub: "Above Threshold" },
            { label: "Contagion Risk", value: metrics.contagionRisk, icon: Shield, color: metrics.contagionRisk === "LOW" ? "text-emerald-400" : "text-amber-400", bg: metrics.contagionRisk === "LOW" ? "bg-emerald-500/10" : "bg-amber-500/10", sub: "Team Status" },
         ].map((stat, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-white/5 hover:bg-slate-800/50 transition-colors">
               <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">{stat.label}</span>
                     <div className={cn("p-1.5 rounded-md", stat.bg, stat.color)}>
                        <stat.icon className="w-3.5 h-3.5" />
                     </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-100 tracking-tight">{stat.value}</div>
                  {stat.sub && <div className="text-[10px] text-slate-500 mt-1">{stat.sub}</div>}
               </CardContent>
            </Card>
         ))}
      </div>

      {/* ─── Main Content Split ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
         
         {/* Team Members List */}
         <Card className="lg:col-span-2 bg-[#020617] border-white/5 flex flex-col h-full">
            <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between">
               <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-sm font-semibold text-slate-200">Team Members <span className="text-slate-500 ml-1 text-xs bg-slate-800 px-1.5 py-0.5 rounded-full">{employees.length}</span></CardTitle>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 className="h-7 text-xs border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                 onClick={handleRunAnalysis}
                 disabled={analysisRunning}
               >
                 {analysisRunning ? "Running..." : "Run Analysis"}
               </Button>
            </CardHeader>
            <ScrollArea className="flex-1">
               <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {employees.map((emp) => (
                     <div 
                        key={emp.user_hash}
                        className={cn(
                           "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200",
                           selectedUser?.user_hash === emp.user_hash 
                              ? "bg-slate-800/80 border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]" 
                              : "bg-slate-900/40 border-border hover:bg-slate-800/40 hover:border-border/80"
                        )}
                        onClick={() => onSelectUser(emp)}
                     >
                        <div className="flex items-center gap-3">
                           <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                              emp.risk_level === "CRITICAL" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              emp.risk_level === "ELEVATED" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                           )}>
                              {emp.name.charAt(0)}
                           </div>
                           <div>
                              <div className={cn("text-xs font-semibold", selectedUser?.user_hash === emp.user_hash ? "text-indigo-200" : "text-slate-300")}>{emp.name}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                 {emp.role} • 
                                 <span className={cn(
                                    emp.risk_level === "CRITICAL" ? "text-red-400" : 
                                    emp.risk_level === "ELEVATED" ? "text-amber-400" : "text-emerald-400"
                                 )}>{emp.velocity?.toFixed(1)} vel</span>
                              </div>
                           </div>
                        </div>
                        <Badge variant="outline" className={cn(
                           "text-[9px] h-5 px-1.5 uppercase font-bold tracking-wider border-0",
                           emp.risk_level === "CRITICAL" ? "bg-red-500 text-white" :
                           emp.risk_level === "ELEVATED" ? "bg-slate-800 text-amber-400 border border-amber-500/30" :
                           "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                        )}>
                           {emp.risk_level}
                        </Badge>
                     </div>
                  ))}
               </div>
            </ScrollArea>
         </Card>

         {/* Selected Employee Detail (Right Panel) */}
         <div className="space-y-4 h-full flex flex-col">
            <Card className="flex-1 bg-slate-900/60 border-white/5 backdrop-blur-md overflow-hidden flex flex-col">
               <CardHeader className="py-4 px-5 border-b border-white/5 bg-slate-900/80">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                     <Activity className="w-4 h-4 text-indigo-400" /> 
                     Risk Assessment
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 p-0 overflow-hidden relative">
                  {selectedUser ? (
                     <ScrollArea className="h-full">
                        <div className="p-5 space-y-6">
                           <RiskAssessment employee={selectedUser} />
                        </div>
                     </ScrollArea>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Select an employee to view detailed risk analysis</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-white/5">
               <CardContent className="p-4">
                  <div className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">AI Recommendation</div>
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-md p-3">
                     <p className="text-xs text-indigo-200/80 leading-relaxed italic">
                        &ldquo;{aiRecommendation}&rdquo;
                     </p>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  )
}
