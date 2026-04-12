"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, 
  Activity, 
  Shield, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  User,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/components/protected-route"
import { TeamNarrative } from "@/components/ai/TeamNarrative"
import { SkillsRadar } from "@/components/skills-radar"
import { api } from "@/lib/api"
import { ExportReport } from "@/components/export-report"

interface TeamMember {
  pseudonym: string
  is_identified: boolean
  real_hash: string | null
  risk_level: string
  has_consent: boolean
}

interface TeamData {
  team: {
    manager_hash: string
    member_count: number
    members: TeamMember[]
  }
  metrics: {
    total_members: number
    at_risk_count: number
    critical_count: number
    consent_rate: string
  } | null
  risk_distribution: {
    LOW: number
    ELEVATED: number
    CRITICAL: number
  } | null
  consent_summary: {
    total: number
    consented: number
    not_consented: number
    percentage: number
  } | null
}

interface TeamAnalytics {
  period_days: number
  team_size: number
  health_score: number
  current_metrics: {
    avg_velocity: number
    critical_count: number
    elevated_count: number
    healthy_count: number
  }
  trends: Array<{
    date: string
    avg_velocity: number
    member_count: number
    risk_distribution: {
      LOW: number
      ELEVATED: number
      CRITICAL: number
    }
  }>
}

interface SkillsData {
  technical: number
  communication: number
  leadership: number
  collaboration: number
  adaptability: number
  creativity: number
  updated_at?: string
}

interface MemberDetails {
  access: "granted" | "denied"
  reason: string
  employee?: {
    user_hash: string
    is_identified: boolean
    consent: boolean
    monitoring_paused: boolean
  }
  risk?: {
    current_level: string
    velocity: number
    confidence: number
    thwarted_belongingness: number
  }
  skills?: SkillsData
}

function getRiskBadgeClass(level: string) {
  switch (level) {
    case "CRITICAL": return "risk-badge-critical"
    case "ELEVATED": return "risk-badge-elevated"
    case "LOW": return "risk-badge-low"
    default: return "bg-muted/50 text-muted-foreground border border-border/50"
  }
}

function getHealthScoreColor(score: number) {
  if (score >= 80) return "[color:hsl(var(--sentinel-healthy))]"
  if (score >= 60) return "[color:hsl(var(--sentinel-elevated))]"
  return "[color:hsl(var(--sentinel-critical))]"
}

function getBarColor(level: string) {
  switch (level) {
    case "CRITICAL": return "bg-[hsl(var(--sentinel-critical))]"
    case "ELEVATED": return "bg-[hsl(var(--sentinel-elevated))]"
    case "LOW": return "bg-[hsl(var(--sentinel-healthy))]"
    default: return "bg-muted"
  }
}

function getVelocityColor(velocity: number) {
  if (velocity > 2.5) return "bg-[hsl(var(--sentinel-critical))]"
  if (velocity > 1.5) return "bg-[hsl(var(--sentinel-elevated))]"
  return "bg-[hsl(var(--sentinel-healthy))]"
}

function PseudonymDisplay({ member }: { member: TeamMember }) {
  const display = member.pseudonym || `Member ${(member.real_hash || "").slice(0, 6)}`
  const initial = display.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${
        member.is_identified
          ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
          : "bg-muted text-muted-foreground"
      }`}>
        {member.is_identified ? <User className="h-4 w-4" /> : initial}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{display}</p>
        <p className="text-xs text-muted-foreground">
          {member.is_identified ? "Identified" : "Anonymized"}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accentColor,
}: {
  label: string
  value: string | number
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  accentColor?: string
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div className={`text-2xl font-semibold font-mono tabular-nums tracking-tight ${accentColor || ""}`}>
        {value}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
    </div>
  )
}

function TeamPageContent() {
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamData = useCallback(async () => {
    if (authLoading) return

    try {
      setLoading(true)

      const [teamRes, analyticsRes] = await Promise.all([
        api.get<TeamData>('/team/?limit=1000'),
        api.get<TeamAnalytics>('/team/analytics?days=30')
      ])

      setTeamData(teamRes as TeamData)
      setAnalytics(analyticsRes as TeamAnalytics)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load team data")
    } finally {
      setLoading(false)
    }
  }, [authLoading])

  useEffect(() => {
    if (!authLoading) {
      fetchTeamData()
    }
  }, [authLoading, fetchTeamData])

  const fetchMemberDetails = async (member: TeamMember) => {
    if (!member.real_hash) {
      setMemberDetails({
        access: "denied",
        reason: "Employee has not consented to share detailed data"
      })
      setSelectedMember(member)
      return
    }

    try {
      const response = await api.get<MemberDetails>(`/team/member/${member.real_hash}`)
      setMemberDetails(response as MemberDetails)
      setSelectedMember(member)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load member details")
    }
  }

  if (loading && !teamData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          <p className="mt-3 text-sm text-muted-foreground">Loading team dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !teamData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!teamData) {
    return null
  }

  if ((!teamData.metrics || teamData.team.member_count === 0) && !loading) {
    return (
      <div className="flex flex-col bg-background min-h-screen">
        <header className="border-b border-border/60">
          <div className="container mx-auto flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)]">
                <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">Team Dashboard</h1>
                <p className="text-xs text-muted-foreground">No team members</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto flex flex-1 items-center justify-center p-6">
          <div className="glass-card rounded-xl p-10 max-w-md w-full text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No Team Members Assigned</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You haven&apos;t been assigned any team members yet. Once employees are added to your team, their wellbeing insights will appear here.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </main>
      </div>
    )
  }

  const totalCount = (teamData.team as any).total_count || teamData.metrics?.total_members || 0

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)]">
              <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold flex items-center gap-2">
                {(teamData.team as any).title || "Team Dashboard"}
                {(teamData.team as any).is_global_view && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Global Admin View
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {totalCount} employees total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportReport
              title="Team Report"
              columns={[
                { key: "name", label: "Name" },
                { key: "risk_level", label: "Risk Level" },
                { key: "consent", label: "Consent" },
              ]}
              data={(teamData.team?.members || []).map((m: any) => ({
                name: m.pseudonym || `User ${m.real_hash?.slice(0, 6) || "—"}`,
                risk_level: m.risk_level || "LOW",
                consent: m.has_consent ? "Granted" : "Not Granted",
              }))}
              summary={[{
                "Team Size": totalCount,
                "Health Score": analytics?.health_score ? `${analytics.health_score}%` : "N/A",
                "Consent Rate": teamData.consent_summary?.percentage ? `${teamData.consent_summary.percentage}%` : "N/A",
                "At Risk": teamData.metrics?.at_risk_count || 0,
              }]}
            />
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-9">
            <TabsTrigger value="overview" className="text-xs px-3">Overview</TabsTrigger>
            <TabsTrigger value="members" className="text-xs px-3">Members</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs px-3">Analytics</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-0 space-y-5">
            {/* Key Metrics */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              <MetricCard
                label="Team Size"
                value={teamData?.metrics?.total_members ?? 0}
                sublabel={(teamData.team as any).is_global_view ? "Total employees" : "Direct reports"}
                icon={Users}
              />
              <MetricCard
                label="Health Score"
                value={`${analytics?.health_score || 0}/100`}
                sublabel="Organization wellbeing"
                icon={Activity}
                accentColor={getHealthScoreColor(analytics?.health_score || 0)}
              />
              <MetricCard
                label="At Risk"
                value={teamData?.metrics?.at_risk_count ?? 0}
                sublabel={`${teamData?.metrics?.critical_count ?? 0} critical cases`}
                icon={AlertTriangle}
                accentColor="[color:hsl(var(--sentinel-critical))]"
              />
              <MetricCard
                label="Consent Rate"
                value={`${teamData?.consent_summary?.percentage ?? 0}%`}
                sublabel="Data sharing enabled"
                icon={Shield}
              />
            </div>

            {/* Risk Distribution */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-1">Risk Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">Current risk levels across the organization</p>
              <div className="space-y-3 stagger-children">
                {Object.entries(teamData?.risk_distribution || {}).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className={`w-20 text-xs font-medium rounded-md px-2 py-0.5 ${getRiskBadgeClass(level)}`}>
                      {level}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${getBarColor(level)}`}
                        style={{ width: `${(count / (teamData?.metrics?.total_members || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-mono tabular-nums text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Health Narrative */}
            {teamData?.team?.manager_hash && (
              <TeamNarrative 
                teamHash={teamData.team.manager_hash}
                days={30}
              />
            )}

            <div className="glass-subtle rounded-lg p-3 flex items-start gap-3">
              <Shield className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Privacy-First Analytics</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Viewing anonymized data for the organization. Individual identities are protected unless explicitly shared.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="mt-0 space-y-5">
            {selectedMember && memberDetails && (
              <div className="glass-card-elevated rounded-xl p-5 bg-primary/5 mb-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedMember.is_identified ? (
                        <User className="h-4 w-4 text-[hsl(var(--primary))]" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-semibold">{selectedMember.pseudonym}</h3>
                      <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${
                        selectedMember.is_identified
                          ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {selectedMember.is_identified ? "Identified" : "Anonymous"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {memberDetails.access === "granted"
                        ? "Detailed metrics available"
                        : "Limited to anonymized summary"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(null); setMemberDetails(null); }}>
                    Close
                  </Button>
                </div>

                {memberDetails.access === "granted" ? (
                  <div className="space-y-4">
                    {memberDetails.risk && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risk Level</p>
                          <span className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${getRiskBadgeClass(memberDetails.risk.current_level)}`}>
                            {memberDetails.risk.current_level}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Velocity</p>
                          <p className="text-lg font-semibold font-mono tabular-nums">
                            {memberDetails.risk.velocity?.toFixed(2) || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Confidence</p>
                          <p className="text-lg font-semibold font-mono tabular-nums">
                            {(memberDetails.risk.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        {memberDetails.employee?.monitoring_paused && (
                          <div className="col-span-3 glass-card rounded-lg p-3 bg-amber-500/5">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--sentinel-elevated))]" />
                              <p className="text-xs font-medium text-[hsl(var(--sentinel-elevated))]">Monitoring Paused</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              This employee has temporarily paused monitoring.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {memberDetails.skills && (
                      <div>
                        <Separator className="mb-4" />
                        <h4 className="text-xs font-medium mb-3">Skills Profile</h4>
                        <SkillsRadar data={memberDetails.skills} height={280} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card rounded-lg p-4 flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Access Limited</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {memberDetails.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Consider having a conversation about how wellbeing support could help them.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {teamData?.team?.members?.map((member) => (
                <button
                  key={member.pseudonym}
                  className="glass-card rounded-xl p-4 text-left w-full cursor-pointer"
                  onClick={() => fetchMemberDetails(member)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <PseudonymDisplay member={member} />
                    <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${getRiskBadgeClass(member.risk_level)}`}>
                      {member.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Consent</span>
                    {member.has_consent ? (
                      <span className="flex items-center gap-1 text-[hsl(var(--sentinel-healthy))]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Granted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[hsl(var(--sentinel-elevated))]">
                        <EyeOff className="h-3.5 w-3.5" />
                        Not granted
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="mt-0 space-y-5">
            {analytics && (
              <>
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <h3 className="text-sm font-semibold">Team Velocity Trend</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Average work intensity over the last {analytics.period_days} days
                  </p>
                  <div className="space-y-3 stagger-children">
                    {analytics.trends.slice(-7).map((day, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-16 text-xs text-muted-foreground font-mono tabular-nums">
                          {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${getVelocityColor(day.avg_velocity)}`}
                            style={{ width: `${Math.min(day.avg_velocity * 20, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs font-mono tabular-nums text-muted-foreground">
                          {day.avg_velocity.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 stagger-children">
                  <MetricCard
                    label="Avg Velocity"
                    value={analytics.current_metrics.avg_velocity.toFixed(2)}
                    sublabel="Team work intensity"
                    icon={Activity}
                  />
                  <MetricCard
                    label="Healthy"
                    value={analytics.current_metrics.healthy_count}
                    sublabel="Low risk level"
                    icon={CheckCircle2}
                    accentColor="[color:hsl(var(--sentinel-healthy))]"
                  />
                  <MetricCard
                    label="Attention"
                    value={analytics.current_metrics.critical_count + analytics.current_metrics.elevated_count}
                    sublabel={`${analytics.current_metrics.critical_count} critical, ${analytics.current_metrics.elevated_count} elevated`}
                    icon={AlertTriangle}
                    accentColor="[color:hsl(var(--sentinel-critical))]"
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function TeamPage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <TeamPageContent />
    </ProtectedRoute>
  )
}
