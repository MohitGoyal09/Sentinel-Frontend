"use client"

import { Suspense, useState, useMemo, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { UserSelector } from "@/components/user-selector"
import { RiskAssessment } from "@/components/risk-assessment"
import { VelocityChart } from "@/components/velocity-chart"
import { ActivityFeed } from "@/components/activity-feed"
import { TeamDistribution } from "@/components/team-distribution"
import { NetworkGraph } from "@/components/network-graph"
import { SimulationPanel } from "@/components/simulation-panel"
import { VaultStatus } from "@/components/vault-status"
import { StatCards } from "@/components/stat-cards"
import { NudgeCard } from "@/components/nudge-card"
import { EmployeeTable } from "@/components/employee-table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { ForecastChart } from "@/components/forecast-chart"
import { AgendaGenerator } from "@/components/copilot/AgendaGenerator"
import { AskSentinel } from "@/components/ai/AskSentinel"
import { AskSentinelWidget } from "@/components/ask-sentinel-widget"
import { ExecutiveSummary } from "@/components/executive-summary"
import { BurnoutPrediction } from "@/components/burnout-prediction"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Shield, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Users,
  RefreshCw,
  Sparkles,
  Zap,
  BarChart3
} from "lucide-react"

// Admin Components
import { GlobalStatsCards } from "@/components/dashboard/admin/global-stats"
import { OrgHealthMap } from "@/components/dashboard/admin/org-health-map"
import { AdminQuickActions } from "@/components/dashboard/admin/admin-actions"
import { AuditLogFeed } from "@/components/dashboard/admin/audit-log"

// Manager Components
// Manager Components
import { TeamStatsRow } from "@/components/dashboard/manager/team-stats-row"
import { TeamGrid } from "@/components/dashboard/manager/team-grid"
import { AnonymityToggle } from "@/components/dashboard/manager/anonymity-toggle"
import { IndividualInsights } from "@/components/dashboard/manager/individual-insights"

// Types
import { Employee, UserSummary, toRiskLevel, PersonaType } from "@/types"

// API Hooks - Simplified without WebSocket
import { useRiskData } from "@/hooks/useRiskData"
import { useNetworkData } from "@/hooks/useNetworkData"
import { useSimulation } from "@/hooks/useSimulation"
import { useTeamData } from "@/hooks/useTeamData"
import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useUsers } from "@/hooks/useUsers"
import { useRecentEvents } from "@/hooks/useRecentEvents"
import { useNudge } from "@/hooks/useNudge"
import { useForecast } from "@/hooks/useForecast"

// Employee profile types (from /me endpoint)
interface UserProfile {
  user_hash: string
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused_until: string | null
  created_at: string
}

interface RiskDataProfile {
  velocity: number | null
  risk_level: string
  confidence: number
  thwarted_belongingness: number | null
  updated_at: string | null
}

interface MonitoringStatus {
  is_paused: boolean
  paused_until: string | null
}

interface AuditEntry {
  action: string
  timestamp: string
  details: any
}

interface MeData {
  user: UserProfile
  risk: RiskDataProfile | null
  audit_trail: AuditEntry[]
  monitoring_status: MonitoringStatus
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeView = searchParams.get("view") || "dashboard"
  const detailedUserHash = searchParams.get("uid")
  
  const { userRole, signOut } = useAuth()
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  
  // Manager view state
  const [isAnonymized, setIsAnonymized] = useState(true)
  
  // Mobile/desktop sidebar is now handled in layout, but mobile trigger might be needed
  // However, we rely on layout for sidebar rendering.
  // The header toggle button logic needs to be updated.
  
  // Employee profile data
  const [profileData, setProfileData] = useState<MeData | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [updatingConsent, setUpdatingConsent] = useState(false)

  // Fetch profile data for employee view
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true)
      const response = await api.get<MeData>('/me')
      setProfileData(response as MeData)
      setProfileError(null)
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Failed to load profile")
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (userRole?.role === 'employee') {
      fetchProfileData()
    }
  }, [userRole])

  const handleUpdateConsent = async (type: "manager" | "anonymized", value: boolean) => {
    try {
      setUpdatingConsent(true)
      const payload = type === "manager" 
        ? { consent_share_with_manager: value }
        : { consent_share_anonymized: value }
      
      await api.put("/me/consent", payload)
      await fetchProfileData()
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Failed to update consent")
    } finally {
      setUpdatingConsent(false)
    }
  }

  const handlePauseMonitoring = async (hours: number) => {
    try {
      await api.post(`/me/pause-monitoring?hours=${hours}`, {})
      await fetchProfileData()
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Failed to pause monitoring")
    }
  }

  const handleResumeMonitoring = async () => {
    try {
      await api.post("/me/resume-monitoring", {})
      await fetchProfileData()
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Failed to resume monitoring")
    }
  }

  // Determine view based on role
  const isEmployee = userRole?.role === 'employee'
  const isManager = userRole?.role === 'manager'
  const isAdmin = userRole?.role === 'admin'

  // Default view is dashboard for all roles
  useEffect(() => {
    if (!activeView || activeView === "profile") {
      if (isAdmin) {
        router.push('/dashboard?view=admin')
      } else if (isManager) {
        router.push('/dashboard?view=team')
      } else {
        router.push('/dashboard?view=dashboard')
      }
    }
  }, [userRole, isAdmin, isManager])

  // 1. Fetch Users
  const { users, isLoading: usersLoading } = useUsers()

  // Select first user by default when users load
  useEffect(() => {
    if (!selectedUserHash && users.length > 0) {
      setSelectedUserHash(users[0].user_hash)
    }
  }, [users, selectedUserHash])

  // Convert API Users to Employee objects for UI components
  const employees = useMemo(() => {
    return users.map(u => ({
      user_hash: u.user_hash,
      name: u.name || `User ${u.user_hash.slice(0, 4)}`,
      role: u.role || "Engineer",
      risk_level: toRiskLevel(u.risk_level),
      velocity: u.velocity || 0,
      confidence: u.confidence || 0,
      belongingness_score: 0.5,
      circadian_entropy: 0.5,
      updated_at: u.updated_at || new Date().toISOString(),
      persona: "Engineer",
      indicators: {
        overwork: false,
        isolation: false,
        fragmentation: false,
        late_night_pattern: false,
        weekend_work: false,
        communication_decline: false
      }
    } as Employee))
  }, [users])

  const selectedBaseEmployee = useMemo(() =>
    employees.find(e => e.user_hash === selectedUserHash) || employees[0] || null
    , [employees, selectedUserHash])

  // 2. Fetch specific data for selected user
  const { data: riskData, refetch: refetchRiskData } = useRiskData(selectedUserHash)
  const { history: fetchedHistory } = useRiskHistory(selectedUserHash)
  const { data: nudgeData } = useNudge(selectedUserHash)
  const { data: networkData, refetch: refetchNetworkData } = useNetworkData(selectedUserHash) // Fetch selected user's network centrality
  const { data: teamData, refetch: refetchTeamData } = useTeamData() // Fetch team Metrics
  const { data: forecastData, isLoading: forecastLoading } = useForecast() // SIR forecast

  const { injectEvent, createPersona } = useSimulation()
  const { events: recentEvents, refetch: refetchEvents } = useRecentEvents()

  // 3. Construct currentEmployee with live risk data
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
        overwork: riskData.indicators.overwork || false,
        isolation: riskData.indicators.isolation || false,
        fragmentation: riskData.indicators.fragmentation || false,
        late_night_pattern: riskData.indicators.late_night_pattern || false,
        weekend_work: riskData.indicators.weekend_work || false,
        communication_decline: riskData.indicators.communication_decline || false,
      }
    } as Employee
  }, [selectedBaseEmployee, riskData])


  // 4. Construct other props
  const history = useMemo(() => {
    if (fetchedHistory && fetchedHistory.length > 0) {
      return fetchedHistory.map((p: any) => ({
        ...p,
        date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        risk_level: toRiskLevel(p.risk_level)
      }))
    }
    return [] // No history, return empty array (do NOT use mock fallback)
  }, [fetchedHistory])

  // Map Activity Events
  const mappedEvents = useMemo(() => {
    return recentEvents.map((e, index) => ({
      id: `evt-${index}-${e.timestamp}`,
      timestamp: e.timestamp,
      event_type: e.event_type,
      description: e.description || `Event: ${e.event_type}`,
      risk_impact: e.risk_impact || "neutral"
    }))
  }, [recentEvents])

  // Map Team Metrics - Dynamic calculation from actual data
  const mappedTeamMetrics = useMemo(() => {
    // Calculate counts from actual employees data
    const total_members = employees.length
    const healthy_count = employees.filter(e => e.risk_level === "LOW" || !e.risk_level).length
    const elevated_count = employees.filter(e => e.risk_level === "ELEVATED").length
    const critical_count = employees.filter(e => e.risk_level === "CRITICAL").length

    const avgVelocity = teamData?.metrics?.avg_velocity || employees.reduce((acc, e) => acc + (e.velocity || 0), 0) / (employees.length || 1)
    const graphFragmentation = teamData?.metrics?.graph_fragmentation || 0
    const commDecayRate = teamData?.metrics?.comm_decay_rate || 0
    const teamRisk = teamData?.team_risk || "LOW"

    // Calculate burnout risk as percentage (based on critical + elevated)
    const atRisk = critical_count + elevated_count
    const burnout_risk = total_members > 0 ? Math.round((atRisk / total_members) * 100) : 0

    return {
      total_members,
      healthy_count,
      elevated_count,
      critical_count,
      avg_velocity: avgVelocity,
      graph_fragmentation: graphFragmentation,
      comm_decay_rate: commDecayRate,
      contagion_risk: toRiskLevel(teamRisk),
      burnout_risk
    }
  }, [teamData, employees])

  const networkNodes = networkData?.nodes || []
  const networkEdges = networkData?.edges || []

  // Handlers
  const handleUserSelect = (emp: Employee) => {
    setSelectedUserHash(emp.user_hash)
  }

  const handleSimulationInject = async (eventType: string) => {
    if (!currentEmployee) return
    try {
      await injectEvent(currentEmployee.user_hash, eventType)
      setTimeout(() => refetchEvents(), 1000) // Refresh feed
    } catch (e) {
      // injection failed
    }
  }

  const handleCreatePersona = async (personaId: string) => {
    const validPersonas: PersonaType[] = ['alex_burnout', 'sarah_gem', 'jordan_steady', 'maria_contagion'];
    if (!validPersonas.includes(personaId as PersonaType)) {
      return;
    }
    try {
      const email = `${personaId.split('_')[0]}@simulation.com`
      await createPersona(email, personaId as PersonaType)
    } catch (e) {
      // persona creation failed
    }
  }

  // Simple refresh handler - replaces WebSocket real-time updates
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchRiskData?.(),
        refetchTeamData?.(),
        refetchEvents?.(),
        refetchNetworkData?.()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchRiskData, refetchTeamData, refetchEvents, refetchNetworkData])

  // Auto-refresh every 60 seconds (simple polling instead of WebSocket)
  useEffect(() => {
    const interval = setInterval(handleRefresh, 60000)
    return () => clearInterval(interval)
  }, [handleRefresh])

  // Determine effective employee for detail viewing - must be called unconditionally
  const detailEmployee = useMemo(() => 
    employees.find(e => e.user_hash === detailedUserHash) || employees[0], 
    [employees, detailedUserHash]
  );

  if (!currentEmployee) {
     return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <DashboardHeader 
        selectedUser={currentEmployee} 
        activeView={activeView} 
      />

      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-6 p-6 lg:p-10 pb-20">

          {/* ==================== 1. DEFAULT DASHBOARD ==================== */}
          {activeView === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">My Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Personal wellness insights and activity feed.</p>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 rounded-lg">
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing' : 'Refresh'}
                   </Button>
                   <AskSentinelWidget />
                </div>
              </div>

              <ExecutiveSummary metrics={mappedTeamMetrics} />
              <StatCards metrics={mappedTeamMetrics} />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                     <Shield className="h-4.5 w-4.5 text-primary" />
                     <h3 className="text-sm font-semibold text-foreground">Risk Factors</h3>
                  </div>
                  <RiskAssessment employee={currentEmployee as any} />
                </div>

                <div className="col-span-3 glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                     <Activity className="h-4.5 w-4.5 text-primary" />
                     <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                  </div>
                  <div className="h-[400px]">
                    <ActivityFeed events={mappedEvents} />
                  </div>
                </div>
              </div>

              <BurnoutPrediction riskData={riskData ?? undefined} history={history} />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                 <div className="col-span-4 metric-card">
                    <h3 className="text-sm font-semibold mb-4 text-foreground">Velocity Trend</h3>
                    <div className="h-[300px]">
                       <VelocityChart history={history} />
                    </div>
                 </div>
                 <div className="col-span-3">
                    <NudgeCard nudge={nudgeData ?? undefined} />
                 </div>
              </div>
            </div>
          )}

          {/* ==================== 2. ADMIN DASHBOARD ==================== */}
          {activeView === "admin" && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center justify-between border-b border-border pb-6">
                  <div>
                     <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">
                        Admin Dashboard
                     </h1>
                     <p className="text-sm text-muted-foreground">System health, organizational overview, and controls.</p>
                  </div>
                  <div className="flex gap-3">
                     <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1">
                        <Shield className="w-3 h-3 mr-2" /> Admin
                     </Badge>
                  </div>
               </div>

               <GlobalStatsCards />

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-6">
                     <OrgHealthMap />
                     <div className="glass-card rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Events</h3>
                        <AuditLogFeed />
                     </div>
                  </div>
                  <div className="col-span-1">
                     <AdminQuickActions />
                  </div>
               </div>
            </div>
          )}

          {/* ==================== 3. MANAGER DASHBOARD ==================== */}
          {activeView === "team" && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex items-center justify-between">
                  <div>
                     <h1 className="text-xl font-semibold text-foreground">Team Dashboard</h1>
                     <p className="text-sm text-muted-foreground">Team velocity, burnout risk, and wellbeing.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <AnonymityToggle
                        isAnonymized={isAnonymized}
                        onToggle={() => setIsAnonymized(!isAnonymized)}
                     />
                  </div>
               </div>

               <TeamStatsRow metrics={mappedTeamMetrics} />

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                     <div className="glass-card rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                           <Users className="h-4.5 w-4.5 text-primary" />
                           <h3 className="text-sm font-semibold text-foreground">Team Members ({employees.length})</h3>
                        </div>
                        <TeamGrid employees={employees} isAnonymized={isAnonymized} />
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="metric-card">
                        <h3 className="text-sm font-semibold mb-4 text-foreground">Team Health</h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Healthy</span>
                              <span className="text-xs font-medium font-mono" style={{color: 'hsl(var(--sentinel-healthy))'}}>{mappedTeamMetrics.healthy_count}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Elevated</span>
                              <span className="text-xs font-medium font-mono" style={{color: 'hsl(var(--sentinel-elevated))'}}>{mappedTeamMetrics.elevated_count}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Critical</span>
                              <span className="text-xs font-medium font-mono" style={{color: 'hsl(var(--sentinel-critical))'}}>{mappedTeamMetrics.critical_count}</span>
                           </div>
                           <div className="pt-2 border-t border-border/50">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs text-muted-foreground">Avg Velocity</span>
                                 <span className="text-xs font-mono tabular-nums text-foreground">{mappedTeamMetrics.avg_velocity.toFixed(1)}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="metric-card">
                        <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Actions</h3>
                        <div className="space-y-2">
                           <Button variant="outline" size="sm" className="w-full justify-start rounded-lg text-xs">
                              <Users className="h-3.5 w-3.5 mr-2" /> Team Roster
                           </Button>
                           <Button variant="outline" size="sm" className="w-full justify-start rounded-lg text-xs">
                              <BarChart3 className="h-3.5 w-3.5 mr-2" /> Analytics
                           </Button>
                           <Button variant="outline" size="sm" className="w-full justify-start rounded-lg text-xs">
                              <Sparkles className="h-3.5 w-3.5 mr-2" /> AI Insights
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* ==================== 4. INDIVIDUAL INSIGHTS ==================== */}
          {activeView === "employee-detail" && (
             <IndividualInsights
                employee={detailEmployee}
                isAnonymized={isAnonymized}
                onBack={() => router.push("/dashboard?view=team")}
                onToggleAnonymity={() => setIsAnonymized(!isAnonymized)}
             />
          )}

          {/* ==================== 5. OTHER VIEWS ==================== */}
          {activeView === "simulation" && <SimulationPanel />}
          {activeView === "network" && <NetworkGraph nodes={networkNodes} edges={networkEdges} />}

          {activeView === "safety-valve" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Safety Valve Engine</h2>
                <p className="text-sm text-muted-foreground">IPT-based burnout detection using behavioral signals.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4.5 w-4.5" style={{color: 'hsl(var(--sentinel-healthy))'}} />
                    <h3 className="text-sm font-semibold text-foreground">Risk Assessment</h3>
                  </div>
                  <RiskAssessment employee={currentEmployee as any} />
                </div>
                <BurnoutPrediction riskData={riskData ?? undefined} history={history} />
              </div>
              <div className="metric-card">
                <h3 className="text-sm font-semibold mb-4">How Safety Valve Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Signal Collection", desc: "Monitors commit times, Slack patterns, Jira velocity, and calendar load." },
                    { title: "IPT Risk Scoring", desc: "Measures thwarted belongingness and perceived burdensomeness via velocity regression." },
                    { title: "Proactive Nudges", desc: "Generates supportive messages — employees first, managers second." },
                  ].map((s) => (
                    <div key={s.title} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                      <h4 className="text-xs font-semibold text-foreground mb-1">{s.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "talent-scout" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Talent Scout Engine</h2>
                <p className="text-sm text-muted-foreground">Network analysis to discover hidden gems.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { label: "Betweenness Centrality", desc: "How often a person bridges disconnected groups.", tag: "Connectors" },
                  { label: "Eigenvector Centrality", desc: "Connected to other important people with outsized influence.", tag: "Influencers" },
                  { label: "Unblocking Score", desc: "Frequency of unblocking teammates via PR reviews.", tag: "Hidden Gems" },
                ].map((m) => (
                  <div key={m.label} className="metric-card">
                    <h3 className="text-xs font-semibold text-foreground mb-1">{m.label}</h3>
                    <p className="text-[11px] text-muted-foreground mb-2">{m.desc}</p>
                    <Badge variant="outline" className="text-[10px]">{m.tag}</Badge>
                  </div>
                ))}
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-1">Team Network Graph</h3>
                <p className="text-xs text-muted-foreground mb-4">Collaboration patterns across the team.</p>
                <div className="h-[400px]">
                  <NetworkGraph nodes={networkNodes} edges={networkEdges} />
                </div>
              </div>
            </div>
          )}

          {activeView === "culture" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Culture Thermometer</h2>
                <p className="text-sm text-muted-foreground">SIR epidemiological model for organizational sentiment.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-1">SIR Contagion Forecast</h3>
                  <p className="text-xs text-muted-foreground mb-4">Susceptible → Infected → Recovered dynamics.</p>
                  <div className="h-[300px]">
                    <ForecastChart data={forecastData} isLoading={forecastLoading} />
                  </div>
                </div>
                <div className="metric-card">
                  <h3 className="text-sm font-semibold mb-4">Model Components</h3>
                  <div className="space-y-3">
                    {[
                      { letter: "S", label: "Susceptible", desc: "Members at risk based on proximity to negative patterns." },
                      { letter: "I", label: "Infected", desc: "Members showing negative shifts in communication patterns." },
                      { letter: "R", label: "Recovered", desc: "Members who improved after intervention." },
                    ].map((s) => (
                      <div key={s.letter} className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">{s.letter}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </ScrollArea>
    </div>
  )
}

function ViewHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  )
}

