import { useMemo, useCallback } from "react"
import {
  ArrowLeft,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  Zap,
  MessageSquare,
  Lock,
  Unlock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Employee } from "@/types"
import { scheduleBreak } from "@/lib/api"
import { toast } from "sonner"

interface IndividualInsightsProps {
  employee: Employee
  isAnonymized: boolean
  onBack: () => void
  onToggleAnonymity: () => void
}

export function IndividualInsights({
  employee,
  isAnonymized,
  onBack,
  onToggleAnonymity
}: IndividualInsightsProps) {

  // Derive insights from actual employee risk data
  const insights = useMemo(() => {
    const results: Array<{ id: number; type: string; title: string; description: string; severity: string; timestamp: string }> = []

    if (employee.confidence > 0.7) {
      results.push({
        id: 1,
        type: "risk",
        title: "Elevated Burnout Risk",
        description: `Burnout confidence is ${(employee.confidence * 100).toFixed(0)}%, indicating significant risk signals.`,
        severity: "high",
        timestamp: "Recent",
      })
    }

    if (employee.indicators.social_withdrawal) {
      results.push({
        id: 2,
        type: "pattern",
        title: "Social Withdrawal",
        description: "Reduced team communication detected. Consider a check-in to re-engage.",
        severity: "medium",
        timestamp: "This week",
      })
    }

    if (employee.indicators.chaotic_hours) {
      results.push({
        id: 3,
        type: "risk",
        title: "Chaotic Schedule",
        description: "Erratic working hours detected, indicating schedule instability.",
        severity: "medium",
        timestamp: "Ongoing",
      })
    }

    if (employee.indicators.sustained_intensity) {
      results.push({
        id: 4,
        type: "risk",
        title: "Sustained High Intensity",
        description: "Consistently high work intensity, indicating potential overextension.",
        severity: "medium",
        timestamp: "Ongoing",
      })
    }

    if (employee.velocity > 3 && !employee.indicators.sustained_intensity) {
      results.push({
        id: 5,
        type: "positive",
        title: "Velocity Spike",
        description: `Commit volume is above average at ${employee.velocity.toFixed(1)} story points/week.`,
        severity: "low",
        timestamp: "This week",
      })
    }

    if (employee.belongingness_score > 0.8) {
      results.push({
        id: 6,
        type: "positive",
        title: "Strong Team Connection",
        description: `Connection index of ${(employee.belongingness_score * 100).toFixed(0)}/100 reflects healthy team integration.`,
        severity: "low",
        timestamp: "This week",
      })
    }

    if (results.length === 0) {
      results.push({
        id: 0,
        type: "pattern",
        title: "Stable Patterns",
        description: "No significant risk indicators detected at this time.",
        severity: "low",
        timestamp: "Now",
      })
    }

    return results
  }, [employee])

  const handleScheduleCheckin = useCallback(async () => {
    // Open window synchronously in click handler (before async gap)
    const calendarWindow = window.open("about:blank", "_blank")
    try {
      const result = await scheduleBreak(employee.user_hash)
      if (result?.calendar_link && calendarWindow) {
        calendarWindow.location.href = result.calendar_link
      } else if (calendarWindow) {
        calendarWindow.close()
      }
      toast.success("Check-in scheduled successfully")
    } catch {
      calendarWindow?.close()
      toast.error("Failed to schedule check-in. Please try again.")
    }
  }, [employee.user_hash])

  const displayName = isAnonymized
    ? `Dev-${employee.user_hash.slice(0, 4).toUpperCase()}`
    : employee.name

  const roleDisplay = isAnonymized ? "Engineer" : employee.role

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "border-[hsl(var(--sentinel-critical))]/50 bg-[hsl(var(--sentinel-critical))]/10"
      case "ELEVATED": return "border-[hsl(var(--sentinel-elevated))]/50 bg-[hsl(var(--sentinel-elevated))]/10"
      case "LOW": return "border-[hsl(var(--sentinel-healthy))]/50 bg-[hsl(var(--sentinel-healthy))]/10"
      default: return "text-muted-foreground border-border bg-muted/10"
    }
  }

  const getRiskColorStyle = (level: string): React.CSSProperties => {
    switch (level) {
      case "CRITICAL": return { color: 'hsl(var(--sentinel-critical))' }
      case "ELEVATED": return { color: 'hsl(var(--sentinel-elevated))' }
      case "LOW": return { color: 'hsl(var(--sentinel-healthy))' }
      default: return {}
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "risk": return <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--sentinel-critical))' }} />
      case "pattern": return <BrainCircuit className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
      case "positive": return <Zap className="h-4 w-4" style={{ color: 'hsl(var(--sentinel-elevated))' }} />
      default: return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Work pattern heatmap: 7 days x 4 weeks grid colored by risk indicators
  const heatmapCells = useMemo(() => {
    const riskScore = employee.confidence
    const cells: number[][] = []
    for (let week = 0; week < 4; week++) {
      const row: number[] = []
      for (let day = 0; day < 7; day++) {
        // Derive pseudo-intensity from risk score + indicators
        const isWeekend = day >= 5
        const weekendBoost = isWeekend && employee.indicators.chaotic_hours ? 0.3 : 0
        const lateBoost = employee.indicators.sustained_intensity ? 0.2 : 0
        const base = Math.max(0, Math.min(1, riskScore + weekendBoost + lateBoost - week * 0.05))
        row.push(base)
      }
      cells.push(row)
    }
    return cells
  }, [employee])

  const heatmapColor = (intensity: number): string => {
    if (intensity > 0.7) return 'hsl(var(--sentinel-critical) / 0.8)'
    if (intensity > 0.4) return 'hsl(var(--sentinel-elevated) / 0.7)'
    return 'hsl(var(--sentinel-healthy) / 0.5)'
  }

  const velocityWidth = `${Math.min((employee.velocity / 5) * 100, 100)}%`
  const belongingnessWidth = `${(employee.belongingness_score ?? 0) * 100}%`

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src={isAnonymized ? undefined : "/avatars/01.png"} />
              <AvatarFallback className={isAnonymized ? "bg-primary/10 text-primary" : ""}>
                {isAnonymized ? <Lock className="h-5 w-5" /> : displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                {displayName}
                <Badge variant="outline" className={`${getRiskColor(employee.risk_level)}`} style={getRiskColorStyle(employee.risk_level)}>
                  {employee.risk_level || "UNKNOWN"} RISK
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {roleDisplay} • ID: {employee.user_hash.slice(0, 8)}
                {isAnonymized && <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded ml-2"><Lock className="h-3 w-3" /> Anonymized View</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onToggleAnonymity} className="gap-2">
            {isAnonymized ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isAnonymized ? "Reveal Identity" : "Anonymize"}
          </Button>
          <Button
            size="sm"
            className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50"
            onClick={handleScheduleCheckin}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Schedule Check-in
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burnout Probability</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{(employee.confidence * 100).toFixed(0)}%</div>
            <Progress value={employee.confidence * 100} className={`h-2 mt-2 bg-muted [&>div]:${employee.confidence > 0.7 ? "bg-red-500" : "bg-primary"}`} />
            <p className="text-xs text-muted-foreground mt-2">--</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocity Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{employee.velocity?.toFixed(1) || "0.0"}</div>
            <p className="text-xs text-muted-foreground mt-1">Story points / week</p>
            <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full" style={{ width: velocityWidth, backgroundColor: 'hsl(var(--sentinel-healthy))' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Avg. active time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Index</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{(employee.belongingness_score * 100).toFixed(0)}/100</div>
            <p className="text-xs text-muted-foreground mt-1">Social connection score</p>
            <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full" style={{ width: belongingnessWidth, backgroundColor: 'hsl(var(--sentinel-info))' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Work Pattern Heatmap */}
        <Card className="col-span-1 lg:col-span-2 border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Work Pattern Analysis
            </CardTitle>
            <CardDescription>
              Activity distribution and risk factors over the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex gap-1 text-[10px] text-muted-foreground">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="flex-1 text-center">{d}</div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {heatmapCells.map((row, weekIdx) => (
                <div key={weekIdx} className="flex gap-1">
                  {row.map((intensity, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="flex-1 h-8 rounded"
                      style={{ backgroundColor: heatmapColor(intensity), opacity: 0.7 + intensity * 0.3 }}
                      title={`Week ${weekIdx + 1}, Day ${dayIdx + 1}: ${(intensity * 100).toFixed(0)}% activity`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--sentinel-healthy) / 0.5)' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--sentinel-elevated) / 0.7)' }} /> Elevated</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--sentinel-critical) / 0.8)' }} /> Critical</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              {employee.indicators.chaotic_hours && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'hsl(var(--sentinel-critical) / 0.05)', borderColor: 'hsl(var(--sentinel-critical) / 0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--sentinel-critical))' }}>Risk Factor</p>
                  <p className="text-sm font-medium text-foreground">Chaotic Schedule</p>
                  <p className="text-xs text-muted-foreground mt-1">Erratic working hours detected.</p>
                </div>
              )}
              {employee.indicators.sustained_intensity && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'hsl(var(--sentinel-elevated) / 0.05)', borderColor: 'hsl(var(--sentinel-elevated) / 0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--sentinel-elevated))' }}>Risk Factor</p>
                  <p className="text-sm font-medium text-foreground">Sustained High Intensity</p>
                  <p className="text-xs text-muted-foreground mt-1">Consistently high work intensity.</p>
                </div>
              )}
              {employee.belongingness_score > 0.6 && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'hsl(var(--sentinel-info) / 0.05)', borderColor: 'hsl(var(--sentinel-info) / 0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--sentinel-info))' }}>Positive Signal</p>
                  <p className="text-sm font-medium text-foreground">Strong Collaboration</p>
                  <p className="text-xs text-muted-foreground mt-1">High connection index.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Feed */}
        <Card className="col-span-1 border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
              AI Insights
            </CardTitle>
            <CardDescription>Generated observations based on telemetry.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{insight.type}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{insight.timestamp}</span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
