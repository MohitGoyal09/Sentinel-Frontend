"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Shield,
  Clock,
  Calendar,
  Coffee,
  UserCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  Award,
  Zap,
  PauseCircle,
  PlayCircle,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Heart,
  Brain,
  Smile,
  Frown,
  Battery,
  Sun,
  Moon,
  Clock3,
  Users,
  Flame,
  Sparkle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { SkillsRadar } from "@/components/skills-radar"
import { AskSentinelWidget } from "@/components/ask-sentinel-widget"
import { api } from "@/lib/api"
import { getRiskHistory, getNetworkAnalysis } from "@/lib/api"
import { toRiskLevel, type RiskLevel, type TalentScoutData } from "@/types"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface UserProfile {
  user_hash: string
  name?: string
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused_until: string | null
  created_at: string
}

interface RiskData {
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

interface MeData {
  user: UserProfile
  risk: RiskData | null
  audit_trail: any[]
  monitoring_status: MonitoringStatus
}

interface RiskHistoryPoint {
  timestamp: string
  risk_level: RiskLevel
  velocity: number
  confidence: number
  belongingness_score: number
}

const riskConfig: Record<RiskLevel, { 
  label: string
  color: string
  bgClass: string
  borderClass: string
  icon: React.ReactNode
  description: string
}> = {
  CRITICAL: {
    label: "High Attention",
    color: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Your wellbeing signals suggest taking a break",
  },
  ELEVATED: {
    label: "Elevated",
    color: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    icon: <Activity className="h-4 w-4" />,
    description: "Some signals detected—consider a wellness check",
  },
  LOW: {
    label: "Balanced",
    color: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Your work patterns look healthy",
  },
}

const wellbeingMetrics = [
  { key: "belongingness", label: "Belongingness", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "energy", label: "Energy Level", icon: Battery, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "focus", label: "Focus Time", icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "rest", label: "Rest Quality", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
]

const aiSuggestions = [
  { type: "break", title: "Take a break", description: "You've been focused for 2+ hours. A short break could boost productivity.", icon: Coffee },
  { type: "meeting", title: "Block focus time", description: "Consider blocking 2 hours tomorrow for deep work.", icon: Clock3 },
  { type: "wellness", title: "Wellness check", description: "Your energy patterns suggest prioritizing rest this week.", icon: Flame },
]

// Dynamic suggestions based on risk level
const getDynamicSuggestions = (riskLevel: string, vel: number) => {
  const suggestions = []
  if (vel > 60) {
    suggestions.push({ type: "break", title: "High velocity detected", description: "Consider taking a break to prevent burnout.", icon: Coffee })
  }
  if (riskLevel === "CRITICAL") {
    suggestions.push({ type: "wellness", title: "Priority: Wellness", description: "Your risk level is elevated. Consider speaking with your manager.", icon: Flame })
  }
  if (suggestions.length === 0) {
    suggestions.push({ type: "good", title: "Great progress", description: "Your work patterns look healthy. Keep it up!", icon: CheckCircle2 })
  }
  return suggestions
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-white/10 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white">{entry.name}:</span>
          <span className="font-mono text-white">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmployeeDashboardContent() {
  const router = useRouter()
  const { signOut, userRole } = useAuth()
  
  const [data, setData] = useState<MeData | null>(null)
  const [riskHistory, setRiskHistory] = useState<RiskHistoryPoint[]>([])
  const [skillsData, setSkillsData] = useState<TalentScoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const meData = await api.get<MeData>('/me')
      setData(meData)

      if (meData?.user?.user_hash) {
        try {
          const historyResponse = await api.get<any>(`/me/risk-history`)
          const historyData = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.history || [])
          setRiskHistory(historyData.map((p: any) => ({ ...p, risk_level: toRiskLevel(p.risk_level) })))
        } catch {
          const fallbackHistory = await getRiskHistory(meData.user.user_hash, 14)
          setRiskHistory(fallbackHistory.map((p: any) => ({ ...p, risk_level: toRiskLevel(p.risk_level) })))
        }

        try {
          const talentData = await getNetworkAnalysis(meData.user.user_hash)
          setSkillsData(talentData)
        } catch (err) {
          // talent data fetch failed
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load your dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateConsent = async (type: "manager" | "anonymized", value: boolean) => {
    if (!data) return
    try {
      setUpdating(true)
      const payload = type === "manager" ? { consent_share_with_manager: value } : { consent_share_anonymized: value }
      await api.put("/me/consent", payload)
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update consent")
    } finally {
      setUpdating(false)
    }
  }

  const pauseMonitoring = async (hours: number) => {
    if (!data) return
    try {
      setUpdating(true)
      await api.post(`/me/pause-monitoring?hours=${hours}`, {})
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to pause monitoring")
    } finally {
      setUpdating(false)
    }
  }

  const resumeMonitoring = async () => {
    if (!data) return
    try {
      setUpdating(true)
      await api.post("/me/resume-monitoring", {})
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resume monitoring")
    } finally {
      setUpdating(false)
    }
  }

  const currentRisk = data?.risk?.risk_level ? riskConfig[toRiskLevel(data.risk.risk_level)] : riskConfig.LOW

  // Generate chart data - use real data or generate mock for demo
  let chartData = riskHistory.map((p, i) => ({
    day: `Day ${i + 1}`,
    velocity: p.velocity || 0,
    risk: p.risk_level === 'CRITICAL' ? 100 : p.risk_level === 'ELEVATED' ? 60 : 30,
    belongingness: p.belongingness_score ? p.belongingness_score * 100 : 50,
  })).reverse()

  // If no real data, use deterministic demo data (no Math.random to avoid hydration flicker)
  if (chartData.length === 0) {
    const demoVelocities = [42, 55, 48, 63, 51, 44, 58, 67, 53, 46, 61, 49, 57, 52]
    const demoRisk = [30, 30, 60, 60, 30, 30, 60, 100, 60, 30, 60, 30, 60, 30]
    const demoBelong = [72, 68, 65, 61, 58, 62, 55, 50, 53, 57, 52, 56, 54, 58]
    chartData = Array.from({ length: 14 }, (_, i) => ({
      day: `Day ${i + 1}`,
      velocity: demoVelocities[i],
      risk: demoRisk[i],
      belongingness: demoBelong[i],
    }))
  }

  // Generate wellbeing data - use real data or deterministic demo values
  const wellbeingFromData = data?.risk?.thwarted_belongingness ? data.risk.thwarted_belongingness * 100 : null
  const mockWellbeing = [
    { key: "belongingness", value: wellbeingFromData || 72, trend: wellbeingFromData ? (wellbeingFromData > 50 ? "+5%" : "-3%") : "+2%", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
    { key: "energy", value: 68, trend: "-2%", icon: Battery, color: "text-green-500", bg: "bg-green-500/10" },
    { key: "focus", value: 78, trend: "+8%", icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "rest", value: 54, trend: "-5%", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  // Get velocity from real data or use deterministic default
  const velocity = data?.risk?.velocity || 58
  const confidence = data?.risk?.confidence || 0.82

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-[#1a1a2e] border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b101b] text-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Wellbeing Dashboard</h1>
            <p className="text-slate-400 text-sm">Track your health metrics and get AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2">
            {data?.monitoring_status?.is_paused ? (
              <Button onClick={resumeMonitoring} variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <PlayCircle className="h-4 w-4 mr-2" /> Resume Monitoring
              </Button>
            ) : (
              <Button onClick={() => pauseMonitoring(24)} variant="outline" size="sm" className="border-slate-600 text-slate-400 hover:bg-slate-700">
                <PauseCircle className="h-4 w-4 mr-2" /> Pause (24h)
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Risk Score & Trends */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Risk Score Card */}
            <Card className="bg-[#1a1a2e] border-white/5 overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-xl", currentRisk.bgClass)}>
                        <Shield className={cn("h-6 w-6", currentRisk.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Wellbeing Score</CardTitle>
                        <CardDescription className="text-slate-400">Based on your work patterns</CardDescription>
                      </div>
                    </div>
                    <Badge className={cn("text-sm px-3 py-1", currentRisk.bgClass, currentRisk.color)}>
                      {currentRisk.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-white">{velocity.toFixed(0)}</p>
                      <p className="text-xs text-slate-400 mt-1">Velocity Score</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-white">{(confidence * 100).toFixed(0)}%</p>
                      <p className="text-xs text-slate-400 mt-1">Confidence</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-white">{data?.risk?.thwarted_belongingness ? (data.risk.thwarted_belongingness * 100).toFixed(0) : Math.round(50 + Math.random() * 30)}%</p>
                      <p className="text-xs text-slate-400 mt-1">Belonging Score</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-white">{mockWellbeing[0].value}%</p>
                      <p className="text-xs text-slate-400 mt-1">Energy Level</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-4 flex items-center gap-2">
                    {currentRisk.icon}
                    {currentRisk.description}
                  </p>
                </CardContent>
              </div>
            </Card>

            {/* Burnout Trend Chart */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Burnout Risk Trend
                    </CardTitle>
                    <CardDescription className="text-slate-400">14-day velocity and risk pattern</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" /> Healthy
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Elevated
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Critical
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" tickLine={false} axisLine={false} />
                        <Tooltip content={<GlassTooltip />} />
                        <Area type="monotone" dataKey="risk" stroke="#ef4444" fill="url(#riskGradient)" strokeWidth={2} name="Risk Level" />
                        <Area type="monotone" dataKey="velocity" stroke="#22c55e" fill="url(#velocityGradient)" strokeWidth={2} name="Velocity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <p>Not enough data yet to show trends</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Radar */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Skill Distribution
                </CardTitle>
                <CardDescription className="text-slate-400">Your expertise areas based on project activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <SkillsRadar data={{
                    technical: 85,
                    communication: 72,
                    leadership: 58,
                    collaboration: 78,
                    adaptability: 65,
                    creativity: 52,
                  }} height={300} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Suggestions & Wellbeing */}
          <div className="space-y-6">
            
            {/* AI Suggestions */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkle className="h-5 w-5 text-yellow-500" />
                  AI Suggestions
                </CardTitle>
                <CardDescription className="text-slate-400">Personalized recommendations for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...getDynamicSuggestions(data?.risk?.risk_level || 'LOW', velocity), ...aiSuggestions].slice(0, 4).map((suggestion, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", suggestion.icon === Coffee ? "bg-amber-500/10" : suggestion.icon === Clock3 ? "bg-blue-500/10" : "bg-red-500/10")}>
                        <suggestion.icon className={cn("h-4 w-4", suggestion.icon === Coffee ? "text-amber-500" : suggestion.icon === Clock3 ? "text-blue-500" : "text-red-500")} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{suggestion.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Wellbeing Metrics */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Wellbeing Metrics
                </CardTitle>
                <CardDescription className="text-slate-400">Key indicators of your wellness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockWellbeing.map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", metric.bg)}>
                        <metric.icon className={cn("h-4 w-4", metric.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{metric.key}</p>
                        <p className="text-xs text-slate-400">{metric.value}%</p>
                      </div>
                    </div>
                    <div className={cn("text-xs font-medium px-2 py-1 rounded-full", metric.trend.startsWith('+') ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                      {metric.trend}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Privacy Controls
                </CardTitle>
                <CardDescription className="text-slate-400">Manage your data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Share with Manager</p>
                    <p className="text-xs text-slate-400">Allow manager to see your insights</p>
                  </div>
                  <Switch checked={data?.user?.consent_share_with_manager || false} onCheckedChange={(v) => updateConsent("manager", v)} disabled={updating} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Anonymous Data</p>
                    <p className="text-xs text-slate-400">Include in team aggregates</p>
                  </div>
                  <Switch checked={data?.user?.consent_share_anonymized || false} onCheckedChange={(v) => updateConsent("anonymized", v)} disabled={updating} />
                </div>
              </CardContent>
            </Card>

            {/* Ask Sentinel */}
            <Card className="bg-[#1a1a2e] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Ask Sentinel
                </CardTitle>
                <CardDescription className="text-slate-400">Get AI insights about your wellbeing</CardDescription>
              </CardHeader>
              <CardContent>
                <AskSentinelWidget />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmployeePage() {
  return (
    <ProtectedRoute allowedRoles={["employee", "manager", "admin"]}>
      <EmployeeDashboardContent />
    </ProtectedRoute>
  )
}
