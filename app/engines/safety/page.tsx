"use client"

import { Suspense, useState, useMemo, useEffect } from "react"

import { RiskAssessment } from "@/components/risk-assessment"
import { StatCards } from "@/components/stat-cards"
import { NudgeCard } from "@/components/nudge-card"
import { VelocityChart } from "@/components/velocity-chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Shield,
  Users,
  Heart,
  AlertTriangle,
  TrendingUp,
  Activity,
  Bell,
  BellOff,
  ChevronRight,
  RefreshCw,
  Zap,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Info,
  MessageSquare
} from "lucide-react"

import { Employee, RiskLevel, toRiskLevel } from "@/types"

import { useRiskData } from "@/hooks/useRiskData"
import { useTeamData } from "@/hooks/useTeamData"
import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useUsers } from "@/hooks/useUsers"
import { useNudge } from "@/hooks/useNudge"

function SafetyContent() {
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  const [showAlertsOnly, setShowAlertsOnly] = useState(false)

  const { users, isLoading: usersLoading } = useUsers()

  useEffect(() => {
    if (!selectedUserHash && users.length > 0) {
      setSelectedUserHash(users[0].user_hash)
    }
  }, [users, selectedUserHash])

  const employees = useMemo(() => {
    return users.map(u => ({
      user_hash: u.user_hash,
      name: u.name || `User ${u.user_hash.slice(0, 4)}`,
      role: u.role || "Engineer",
      risk_level: toRiskLevel(u.risk_level),
      velocity: u.velocity || 0,
      confidence: u.confidence || 0,
      belongingness_score: u.belongingness_score || 0.5,
      circadian_entropy: u.circadian_entropy || 0.5,
      updated_at: u.updated_at || new Date().toISOString(),
      persona: "Engineer",
      indicators: {
        overwork: u.overwork || false,
        isolation: u.isolation || false,
        fragmentation: u.fragmentation || false,
        late_night_pattern: u.late_night_pattern || false,
        weekend_work: u.weekend_work || false,
        communication_decline: u.communication_decline || false
      }
    } as Employee))
  }, [users])

  const selectedBaseEmployee = useMemo(() =>
    employees.find(e => e.user_hash === selectedUserHash) || employees[0] || null
  , [employees, selectedUserHash])

  const { data: riskData } = useRiskData(selectedUserHash)
  const { data: nudgeData } = useNudge(selectedUserHash)
  const { data: teamData } = useTeamData()
  const { history: riskHistory } = useRiskHistory(selectedUserHash)

  const currentEmployee = useMemo(() => {
    if (!selectedBaseEmployee) return null
    if (!riskData) return selectedBaseEmployee
    return {
      ...selectedBaseEmployee,
      risk_level: riskData.risk_level,
      velocity: riskData.velocity,
      confidence: riskData.confidence,
      belongingness_score: riskData.belongingness_score,
      circadian_entropy: riskData.circadian_entropy,
      indicators: {
        overwork: riskData.indicators?.overwork || false,
        isolation: riskData.indicators?.isolation || false,
        fragmentation: riskData.indicators?.fragmentation || false,
        late_night_pattern: riskData.indicators?.late_night_pattern || false,
        weekend_work: riskData.indicators?.weekend_work || false,
        communication_decline: riskData.indicators?.communication_decline || false,
      }
    } as Employee
  }, [selectedBaseEmployee, riskData])

  const mappedTeamMetrics = useMemo(() => {
    if (!teamData) {
      const total = employees.length
      const healthy = employees.filter(e => e.risk_level === "LOW").length
      const elevated = employees.filter(e => e.risk_level === "ELEVATED").length
      const critical = employees.filter(e => e.risk_level === "CRITICAL").length
      const avgVel = employees.reduce((sum, e) => sum + e.velocity, 0) / (total || 1)
      
      return {
        total_members: total,
        healthy_count: healthy,
        elevated_count: elevated,
        critical_count: critical,
        avg_velocity: avgVel,
        contagion_risk: critical > 2 ? "CRITICAL" : elevated > 4 ? "ELEVATED" : "LOW",
        graph_fragmentation: 0.3,
        comm_decay_rate: 0.15,
      }
    }

    const total = employees.length
    const healthy = employees.filter(e => e.risk_level === "LOW").length
    const elevated = employees.filter(e => e.risk_level === "ELEVATED").length
    const critical = employees.filter(e => e.risk_level === "CRITICAL").length

    return {
      total_members: total,
      healthy_count: healthy,
      elevated_count: elevated,
      critical_count: critical,
      avg_velocity: teamData.metrics?.avg_velocity || employees.reduce((sum, e) => sum + e.velocity, 0) / (total || 1),
      contagion_risk: teamData.contagion_risk || (critical > 2 ? "CRITICAL" : elevated > 4 ? "ELEVATED" : "LOW"),
      graph_fragmentation: teamData.graph_fragmentation || 0.3,
      comm_decay_rate: teamData.metrics?.comm_decay_rate || 0.15,
    }
  }, [teamData, employees])

  const teamRiskScore = useMemo(() => {
    if (mappedTeamMetrics.total_members === 0) return 0
    const weightedScore = (
      (mappedTeamMetrics.critical_count * 100) +
      (mappedTeamMetrics.elevated_count * 50) +
      (mappedTeamMetrics.healthy_count * 10)
    ) / mappedTeamMetrics.total_members
    return Math.min(Math.round(weightedScore), 100)
  }, [mappedTeamMetrics])

  const riskDistribution = useMemo(() => {
    const total = employees.length || 1
    return {
      critical: mappedTeamMetrics.critical_count,
      criticalPct: Math.round((mappedTeamMetrics.critical_count / total) * 100),
      elevated: mappedTeamMetrics.elevated_count,
      elevatedPct: Math.round((mappedTeamMetrics.elevated_count / total) * 100),
      healthy: mappedTeamMetrics.healthy_count,
      healthyPct: Math.round((mappedTeamMetrics.healthy_count / total) * 100),
    }
  }, [employees, mappedTeamMetrics])

  const highRiskEmployees = useMemo(() => {
    return employees
      .filter(e => e.risk_level === "CRITICAL" || e.risk_level === "ELEVATED")
      .sort((a, b) => {
        const order = { CRITICAL: 0, ELEVATED: 1, LOW: 2 }
        return order[a.risk_level] - order[b.risk_level]
      })
  }, [employees])

  const filteredEmployees = showAlertsOnly 
    ? highRiskEmployees 
    : employees

  const mockHistory = useMemo(() => {
    const days = 30
    const history = []
    let velocity = 1.2 + Math.random() * 0.5
    let belongingness = 0.6 + Math.random() * 0.2
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      velocity += (Math.random() - 0.5) * 0.3
      velocity = Math.max(0.5, Math.min(3, velocity))
      
      belongingness += (Math.random() - 0.5) * 0.1
      belongingness = Math.max(0.2, Math.min(0.9, belongingness))
      
      history.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        velocity: parseFloat(velocity.toFixed(2)),
        belongingness_score: parseFloat(belongingness.toFixed(2))
      })
    }
    return history
  }, [])

  const chartData = riskHistory && riskHistory.length > 0 ? riskHistory : mockHistory

  const handleUserSelect = (emp: Employee) => {
    setSelectedUserHash(emp.user_hash)
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "text-[hsl(var(--sentinel-critical))]"
      case "ELEVATED":
        return "text-[hsl(var(--sentinel-elevated))]"
      case "LOW":
        return "text-[hsl(var(--sentinel-healthy))]"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-[hsl(var(--sentinel-critical))]/10 border-[hsl(var(--sentinel-critical))]/20"
      case "ELEVATED":
        return "bg-[hsl(var(--sentinel-elevated))]/10 border-[hsl(var(--sentinel-elevated))]/20"
      case "LOW":
        return "bg-[hsl(var(--sentinel-healthy))]/10 border-[hsl(var(--sentinel-healthy))]/20"
      default:
        return "bg-muted/50"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-8 p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-critical))]/15 border border-[hsl(var(--sentinel-critical))]/20">
                <Shield className="h-6 w-6 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Safety Valve</h2>
                <p className="text-sm text-muted-foreground">Burnout detection & risk analysis</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Hero Section */}
          <div className="glass-card-elevated relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[hsl(var(--sentinel-critical))]/3" />
            
            <div className="relative grid gap-10 p-8 md:grid-cols-2 lg:gap-14">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--sentinel-critical))]/10 blur-3xl" />
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {teamRiskScore}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                        Risk Score
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {teamRiskScore >= 60 ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
                      <span className="text-sm font-medium text-[hsl(var(--sentinel-critical))]">High team risk — Immediate action needed</span>
                    </>
                  ) : teamRiskScore >= 30 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
                      <span className="text-sm font-medium text-[hsl(var(--sentinel-elevated))]">Elevated risk — Monitor closely</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sentinel-healthy))]" />
                      <span className="text-sm font-medium text-[hsl(var(--sentinel-healthy))]">Team health is good</span>
                    </>
                  )}
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="flex flex-col justify-center gap-4">
                {/* Critical */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                      <AlertTriangle className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--sentinel-critical))]">Critical</p>
                      <p className="text-[11px] text-muted-foreground">Immediate attention required</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-critical))]">{riskDistribution.critical}</p>
                    <p className="text-[10px] text-muted-foreground">{riskDistribution.criticalPct}%</p>
                  </div>
                </div>

                {/* Elevated */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-elevated))]/10">
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--sentinel-elevated))]">Elevated</p>
                      <p className="text-[11px] text-muted-foreground">Monitoring closely</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-elevated))]">{riskDistribution.elevated}</p>
                    <p className="text-[10px] text-muted-foreground">{riskDistribution.elevatedPct}%</p>
                  </div>
                </div>

                {/* Healthy */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-healthy))]/10">
                      <Heart className="h-4 w-4 text-[hsl(var(--sentinel-healthy))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--sentinel-healthy))]">Healthy</p>
                      <p className="text-[11px] text-muted-foreground">Within normal range</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-healthy))]">{riskDistribution.healthy}</p>
                    <p className="text-[10px] text-muted-foreground">{riskDistribution.healthyPct}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Burnout Prediction */}
          <div className="glass-card rounded-2xl p-6 border border-[hsl(var(--sentinel-critical))]/15">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Burnout Prediction</h3>
                <p className="text-xs text-muted-foreground">AI-powered risk forecasting based on behavioral patterns</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* High Risk */}
              <div className="metric-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[hsl(var(--sentinel-critical))]">High Risk (2 Weeks)</span>
                  <Badge className="text-[10px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                    {employees.filter(e => e.risk_level === "CRITICAL").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Employees showing signs of potential burnout
                </p>
                <div className="space-y-2">
                  {employees.filter(e => e.risk_level === "CRITICAL").slice(0, 3).map(emp => (
                    <div key={emp.user_hash} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sentinel-critical))]" />
                      <span className="text-foreground">{emp.name}</span>
                    </div>
                  ))}
                  {employees.filter(e => e.risk_level === "CRITICAL").length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No high-risk predictions</p>
                  )}
                </div>
              </div>

              {/* At Risk */}
              <div className="metric-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[hsl(var(--sentinel-elevated))]">At Risk (4 Weeks)</span>
                  <Badge className="text-[10px] bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20">
                    {employees.filter(e => e.risk_level === "ELEVATED").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Employees who may become at-risk without intervention
                </p>
                <div className="space-y-2">
                  {employees.filter(e => e.risk_level === "ELEVATED").slice(0, 3).map(emp => (
                    <div key={emp.user_hash} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sentinel-elevated))]" />
                      <span className="text-foreground">{emp.name}</span>
                    </div>
                  ))}
                  {employees.filter(e => e.risk_level === "ELEVATED").length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No at-risk predictions</p>
                  )}
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="metric-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[hsl(var(--sentinel-healthy))]">Prevention Actions</span>
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sentinel-healthy))]" />
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Recommended interventions based on current patterns
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-[hsl(var(--sentinel-healthy))] mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Schedule mandatory breaks for high-velocity employees</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3 w-3 text-[hsl(var(--sentinel-healthy))] mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Initiate 1:1 check-ins with at-risk team members</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Heart className="h-3 w-3 text-[hsl(var(--sentinel-healthy))] mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Review workload distribution across the team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics as any} />}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Employee Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {filteredEmployees.length}
                  </Badge>
                </div>
                <Button
                  variant={showAlertsOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                  className={showAlertsOnly ? "bg-[hsl(var(--sentinel-critical))] hover:bg-[hsl(var(--sentinel-critical))]/90 text-white" : ""}
                >
                  {showAlertsOnly ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                  {showAlertsOnly ? "Showing Alerts" : "Show Alerts Only"}
                </Button>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.user_hash}
                    onClick={() => handleUserSelect(emp)}
                    className={`relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                      selectedUserHash === emp.user_hash
                        ? `${getRiskBg(emp.risk_level)} border-current shadow-sm`
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={emp.name} />
                      <AvatarFallback className={`text-[10px] ${getRiskBg(emp.risk_level)}`}>
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                        <Badge
                          variant="outline"
                          className={`ml-2 text-[9px] px-1.5 py-0 ${getRiskBg(emp.risk_level)}`}
                        >
                          {emp.risk_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{emp.role}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className={`text-[11px] font-mono tabular-nums font-medium ${getRiskColor(emp.risk_level)}`}>
                          {emp.velocity.toFixed(1)} vel
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Selected Employee</h3>
              </div>

              {currentEmployee ? (
                <div className="space-y-4">
                  <RiskAssessment employee={currentEmployee} />
                  <NudgeCard nudge={nudgeData ?? undefined} />
                </div>
              ) : (
                <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16">
                  <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Select an employee to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* High Risk Alerts */}
          {highRiskEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--sentinel-critical))]" />
                <h3 className="text-base font-semibold text-foreground">High Risk Alerts</h3>
                <Badge className="ml-1 text-[10px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                  {highRiskEmployees.length}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {highRiskEmployees.slice(0, 6).map((emp) => (
                  <button
                    key={emp.user_hash}
                    onClick={() => handleUserSelect(emp)}
                    className={`glass-card rounded-xl p-4 text-left transition-all hover:shadow-sm cursor-pointer ${
                      emp.risk_level === "CRITICAL"
                        ? "border border-[hsl(var(--sentinel-critical))]/25"
                        : "border border-[hsl(var(--sentinel-elevated))]/25"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={
                          emp.risk_level === "CRITICAL" 
                            ? "bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))]" 
                            : "bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))]"
                        }>
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.role}</p>
                      </div>
                      <Badge
                        className={
                          emp.risk_level === "CRITICAL"
                            ? "text-[9px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20"
                            : "text-[9px] bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20"
                        }
                      >
                        {emp.risk_level}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Velocity Trends */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Velocity Trends</h3>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-critical))]" />
                  <span>Velocity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
                  <span>Belongingness</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <VelocityChart history={chartData} title="" />
            </div>
          </div>

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

export default function SafetyValvePage() {
  return (
    <ProtectedRoute>
      <SafetyContent />
    </ProtectedRoute>
  )
}
