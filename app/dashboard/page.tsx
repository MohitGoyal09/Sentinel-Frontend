"use client"

import { Suspense } from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { StatCards } from "@/components/stat-cards"
import { UserSelector } from "@/components/user-selector"
import { RiskAssessment } from "@/components/risk-assessment"
import { VelocityChart } from "@/components/velocity-chart"
import { ActivityFeed } from "@/components/activity-feed"
import { NudgeCard } from "@/components/nudge-card"
import { TeamDistribution } from "@/components/team-distribution"
import { NetworkGraph } from "@/components/network-graph"
import { SimulationPanel } from "@/components/simulation-panel"
import { VaultStatus } from "@/components/vault-status"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { ForecastChart } from "@/components/forecast-chart"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Activity, 
  Shield, 
  User, 
  Clock, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  History,
  LogOut,
  Users
} from "lucide-react"

// Types
import { Employee, UserSummary, PersonaType, toRiskLevel } from "@/types"

// API Hooks
import { useRiskData } from "@/hooks/useRiskData"
import { useNetworkData } from "@/hooks/useNetworkData"
import { useSimulation } from "@/hooks/useSimulation"
import { useTeamData } from "@/hooks/useTeamData"
import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useUsers } from "@/hooks/useUsers"
import { useRecentEvents } from "@/hooks/useRecentEvents"
import { useNudge } from "@/hooks/useNudge"
import { useWebSocket } from "@/hooks/useWebSocket"
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
  const activeView = searchParams.get('view') || 'dashboard'
  
  const { userRole, signOut } = useAuth()
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  
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
      router.push('/dashboard?view=dashboard')
    }
  }, [userRole])

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
  const { data: riskData } = useRiskData(selectedUserHash)
  const { history: fetchedHistory } = useRiskHistory(selectedUserHash)
  const { data: nudgeData } = useNudge(selectedUserHash)
  const { data: networkData } = useNetworkData(selectedUserHash) // Fetch selected user's network centrality
  const { data: teamData } = useTeamData() // Fetch team Metrics
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
    if (!teamData) return null

    // Calculate counts from actual employees data
    const total_members = employees.length
    const healthy_count = employees.filter(e => e.risk_level === "LOW").length
    const elevated_count = employees.filter(e => e.risk_level === "ELEVATED").length
    const critical_count = employees.filter(e => e.risk_level === "CRITICAL").length
    const calibrating_count = employees.filter(e => e.risk_level === "CALIBRATING" || !e.risk_level).length

    return {
      total_members,
      healthy_count,
      elevated_count,
      critical_count,
      calibrating_count,
      avg_velocity: teamData.metrics.avg_velocity,
      graph_fragmentation: teamData.metrics.graph_fragmentation,
      comm_decay_rate: teamData.metrics.comm_decay_rate,
      contagion_risk: toRiskLevel(teamData.team_risk)
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
      console.error("Simulation injection failed", e)
    }
  }

  const handleCreatePersona = async (personaId: string) => {
    const validPersonas: PersonaType[] = ['alex_burnout', 'sarah_gem', 'jordan_steady', 'maria_contagion'];
    if (!validPersonas.includes(personaId as PersonaType)) {
      console.error(`Invalid persona type: ${personaId}`);
      return;
    }
    try {
      const email = `${personaId.split('_')[0]}@simulation.com`
      await createPersona(email, personaId as PersonaType)
    } catch (e) {
      console.error("Failed to create persona", e)
    }
  }

  if (!currentEmployee) {
     return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>
  }

  return (
    <div className="flex flex-1 flex-col">
        <DashboardHeader
          selectedUser={currentEmployee}
          activeView={activeView}
        />

        <ScrollArea className="flex-1">
          <main className="flex flex-col gap-6 p-5 lg:p-8">
            {/* ==================== OVERVIEW ==================== */}
            {activeView === "dashboard" && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Team Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Real-time team health metrics and individual risk analysis.</p>
                </div>

                {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics} />}

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="user-select"
                  >
                    Active User Analysis
                  </label>
                  <UserSelector
                    employees={employees}
                    selectedUser={currentEmployee}
                    onSelect={handleUserSelect}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="flex flex-col gap-6 lg:col-span-1">
                    <NudgeCard nudge={nudgeData || undefined} />
                  </div>
                  <div className="flex flex-col gap-6 lg:col-span-2">
                    <VelocityChart history={history} />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <ActivityFeed events={mappedEvents} />
                      <VaultStatus eventCount={recentEvents.length} userCount={employees.length} />
                    </div>
                  </div>
                </div>

                <TeamDistribution employees={employees} />
              </>
            )}

            {/* SAFETY VALVE */}
            {activeView === "safety-valve" && (
              <>
                <ViewHeader
                  title="Safety Valve Engine"
                  description="Individual burnout detection and prevention."
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="user-select">Select User</label>
                  <UserSelector
                    employees={employees}
                    selectedUser={currentEmployee}
                    onSelect={handleUserSelect}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <RiskAssessment employee={currentEmployee} />
                  <div className="flex flex-col gap-6 lg:col-span-2">
                    <NudgeCard nudge={nudgeData || undefined} />
                  </div>
                </div>
                <ActivityFeed events={mappedEvents} />
              </>
            )}

            {/* TALENT SCOUT */}
            {activeView === "talent-scout" && (
              <>
                <ViewHeader
                  title="Talent Scout Engine"
                  description="Network analysis to identify hidden gems."
                />

                <NetworkGraph nodes={networkNodes} edges={networkEdges} />

                {/* Performers List or Hidden Gems */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {networkNodes
                    .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
                    .map((node) => (
                      <div
                        key={node.id}
                        className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold text-foreground">{node.label}</span>
                          <span className="text-[10px] text-muted-foreground">ID: {node.id.slice(0, 4)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Betweenness</p>
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {(node.betweenness || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* CULTURE THERMOMETER */}
            {activeView === "culture" && (
              <>
                <ViewHeader title="Culture Thermometer" description="Team-level health monitoring with SIR epidemic model." />
                {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics} />}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <TeamDistribution employees={employees} />
                  <ForecastChart data={forecastData} isLoading={forecastLoading} />
                </div>
                <NetworkGraph nodes={networkNodes} edges={networkEdges} />
              </>
            )}

            {/* NETWORK GRAPH */}
            {activeView === "network" && (
              <>
                <ViewHeader title="Network Graph" description="Team interaction topology." />
                <NetworkGraph nodes={networkNodes} edges={networkEdges} />
                <VaultStatus eventCount={recentEvents.length} userCount={employees.length} />
              </>
            )}

            {/* SIMULATION */}
            {activeView === "simulation" && (
              <>
              <ViewHeader title="Simulation Mode" description="Generate digital twins and inject events." />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <SimulationPanel
                    onInjectEvent={handleSimulationInject}
                    onRunSimulation={handleCreatePersona}
                  />
                  <VaultStatus eventCount={recentEvents.length} userCount={employees.length} />
                </div>

                <UserSelector
                  employees={employees}
                  selectedUser={currentEmployee}
                  onSelect={handleUserSelect}
                />
                 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                   <RiskAssessment employee={currentEmployee} />
                   <div className="lg:col-span-2">
                     <VelocityChart history={history} />
                   </div>
                 </div>
               </>
            )}

            {/* MANAGER TEAM VIEW */}
            {activeView === "team" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Team Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Your team's health metrics and member overview.</p>
                </div>
                
                {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics as any} />}
                
                <TeamDistribution employees={employees} />
              </div>
            )}

            {/* ADMIN VIEW */}
            {activeView === "admin" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
                  <p className="text-sm text-muted-foreground">System administration and user management.</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{employees.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {employees.filter(e => e.risk_level === 'CRITICAL' || e.risk_level === 'ELEVATED').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Button onClick={() => router.push('/admin')}>
                  Go to Full Admin Panel
                </Button>
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
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
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

