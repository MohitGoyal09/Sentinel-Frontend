"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Activity, 
  Shield, 
  Eye, 
  EyeOff,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  User,
  Network,
  BarChart3,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"

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
    CALIBRATING: number
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
}

function TeamPageContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12) // Show 12 cards per page

  useEffect(() => {
    fetchTeamData(currentPage)
  }, [currentPage])

  const fetchTeamData = async (page: number) => {
    try {
      setLoading(true)
      const skip = (page - 1) * pageSize
      console.log(`[team] Fetching team data (page ${page})...`)
      console.log(`[team] Auth token present:`, !!localStorage.getItem('sb-access-token'))
      
      const [teamRes, analyticsRes] = await Promise.all([
        api.get<TeamData>(`/team?skip=${skip}&limit=${pageSize}`),
        api.get<TeamAnalytics>('/team/analytics?days=30')
      ])
      
      console.log('[team] Team response:', teamRes)
      setTeamData(teamRes as TeamData)
      setAnalytics(analyticsRes as TeamAnalytics)
      setError(null)
    } catch (err: any) {
      console.error('[team] Error fetching team data:', err)
      console.error('[team] Response status:', err.response?.status)
      console.error('[team] Response data:', err.response?.data)
      setError(err.response?.data?.detail || err.message || "Failed to load team data")
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberDetails = async (member: TeamMember) => {
    if (!member.real_hash) {
      setMemberDetails({
        access: "denied",
        reason: "Employee has not consented to share detailed data"
      })
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200"
      case "ELEVATED": return "bg-amber-100 text-amber-800 border-amber-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setCurrentPage(newPage)
    }
  }

  if (loading && !teamData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading team dashboard...</p>
        </div>
      </div>
    )
  }

  // Error State (only if no data at all and we have an error)
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

  // Valid Data Check
  if (!teamData) {
    return null
  }

  // EMPTY STATE Handling
  if ((!teamData.metrics || teamData.team.member_count === 0) && !loading) {
     // ... (Existing Empty State JSX - omitted for brevity, keeping same logic)
    return (
      <div className="flex flex-col bg-background min-h-screen">
          <header className="border-b bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Team Dashboard</h1>
                <p className="text-xs text-muted-foreground">No team members</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-4 lg:p-8 flex items-center justify-center flex-1">
          <Card className="max-w-lg w-full text-center p-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">No Team Members Assigned</CardTitle>
            <CardDescription className="mb-6">
              You haven't been assigned any team members yet. Once employees are added to your team, their wellbeing insights will appear here.
            </CardDescription>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </Card>
        </main>
      </div>
    )
  }

  // Derived check for pagination
  const totalCount = (teamData.team as any).total_count || teamData.metrics?.total_members || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                {(teamData.team as any).title || "Team Dashboard"}
                {(teamData.team as any).is_global_view && (
                  <Badge variant="secondary" className="text-xs">Global Admin View</Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {totalCount} employees total
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamData?.metrics?.total_members}</div>
                  <p className="text-xs text-muted-foreground">{(teamData.team as any).is_global_view ? "Total employees" : "Direct reports"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getHealthScoreColor(analytics?.health_score || 0)}`}>
                    {analytics?.health_score || 0}/100
                  </div>
                  <p className="text-xs text-muted-foreground">Overall organization wellbeing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {teamData?.metrics?.at_risk_count}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {teamData?.metrics?.critical_count} critical cases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {teamData?.consent_summary?.percentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data sharing enabled
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Current risk levels across the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(teamData?.risk_distribution || {}).map(([level, count]) => (
                    <div key={level} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{level}</div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              level === "CRITICAL" ? "bg-red-500" :
                              level === "ELEVATED" ? "bg-amber-500" :
                              level === "LOW" ? "bg-green-500" : "bg-gray-500"
                            }`}
                            style={{
                              width: `${(count / (teamData?.metrics?.total_members || 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

             <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy-First Analytics</AlertTitle>
              <AlertDescription>
                Viewing anonymized data for whole organization. Individual identities are protected unless explicitly shared.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="space-y-6">
             {/* Pagination Controls */}
             <div className="flex items-center justify-between py-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  Next
                </Button>
             </div>

            {selectedMember && memberDetails && (
              <Card className="border-primary mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedMember.is_identified ? (
                          <>
                            <User className="h-5 w-5" />
                            {selectedMember.pseudonym} (Identified)
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-5 w-5" />
                            {selectedMember.pseudonym} (Anonymous)
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {memberDetails.access === "granted" 
                          ? "Detailed metrics available" 
                          : "Limited to anonymized summary"}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {memberDetails.access === "granted" && memberDetails.risk ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <Badge className={getRiskColor(memberDetails.risk.current_level)}>
                          {memberDetails.risk.current_level}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Velocity</p>
                        <p className="text-lg font-semibold">{memberDetails.risk.velocity?.toFixed(2) || "N/A"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{(memberDetails.risk.confidence * 100).toFixed(0)}%</p>
                      </div>
                      {memberDetails.employee?.monitoring_paused && (
                        <Alert className="col-span-3 border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Monitoring Paused</AlertTitle>
                          <AlertDescription className="text-amber-700">
                            This employee has temporarily paused monitoring.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
                        <EyeOff className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Access Limited</p>
                          <p className="text-sm text-muted-foreground">
                            {memberDetails.reason}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This employee has not consented to share detailed wellbeing data. 
                        Consider having a conversation about how wellbeing support could help them.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamData?.team?.members?.map((member) => (
                <Card 
                  key={member.pseudonym}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => fetchMemberDetails(member)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          member.is_identified ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {member.is_identified ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{member.pseudonym}</CardTitle>
                          <CardDescription className="text-xs">
                            {(member as any).department ? (member as any).department : (member.is_identified ? "Identified" : "Anonymous")}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getRiskColor(member.risk_level)}>
                        {member.risk_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Consent</span>
                      {member.has_consent ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Granted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <EyeOff className="h-4 w-4" />
                          Not granted
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
             {/* Pagination Controls Bottom */}
             <div className="flex items-center justify-center py-6">
                 <div className="flex items-center gap-4">
                    <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    >
                    Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    >
                    Next
                    </Button>
                 </div>
             </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Team Velocity Trend
                    </CardTitle>
                    <CardDescription>
                      Average work intensity over the last {analytics.period_days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.trends.slice(-7).map((day, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-muted-foreground">
                            {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full ${
                                  day.avg_velocity > 2.5 ? "bg-red-500" :
                                  day.avg_velocity > 1.5 ? "bg-amber-500" : "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(day.avg_velocity * 20, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm font-medium">
                            {day.avg_velocity.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {/* ... (Metrics Grid - Same as before) */}
                 <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Velocity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.current_metrics.avg_velocity.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Team work intensity</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Healthy Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.current_metrics.healthy_count}
                      </div>
                      <p className="text-xs text-muted-foreground">Low risk level</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.current_metrics.critical_count + analytics.current_metrics.elevated_count}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.current_metrics.critical_count} critical, {analytics.current_metrics.elevated_count} elevated
                      </p>
                    </CardContent>
                  </Card>
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
    <ProtectedRoute>
      <TeamPageContent />
    </ProtectedRoute>
  )
}
