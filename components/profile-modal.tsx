"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck, MessageSquare, Brain,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SkillsRadar } from "@/components/skills-radar"
import { api, scheduleBreak } from "@/lib/api"
import { cn, getInitials } from "@/lib/utils"

interface ProfileModalProps {
  userHash: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProfileData {
  user_hash: string
  name: string
  role: string
  team: string | null
  date_joined: string | null
  risk: {
    risk_level: string
    velocity: number
    confidence: number
    belongingness_score: number
    attrition_probability: number
    circadian_entropy?: number
  } | null
  skills: {
    technical: number
    communication: number
    leadership: number
    collaboration: number
    adaptability: number
    creativity: number
  } | null
  network: {
    betweenness: number
    eigenvector: number
    unblocking_count: number
  } | null
  indicators?: {
    chaotic_hours?: boolean
    social_withdrawal?: boolean
    sustained_intensity?: boolean
  } | null
}

const riskBadgeStyle = (level: string) => {
  switch (level) {
    case "CRITICAL": return "bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20"
    case "ELEVATED": return "bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20"
    default: return "bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))] border-[hsl(var(--sentinel-healthy))]/20"
  }
}

function getActiveIndicators(data: ProfileData): string[] {
  const labels: string[] = []
  if (data.indicators?.chaotic_hours) labels.push("Chaotic Schedule")
  if (data.indicators?.social_withdrawal) labels.push("Social Withdrawal")
  if (data.indicators?.sustained_intensity) labels.push("Sustained Intensity")
  return labels
}

function generateAssessment(data: ProfileData): string {
  const risk = data.risk
  if (!risk) return "Insufficient data for AI assessment."

  const connectionPct = Math.round(risk.belongingness_score * 100)
  const entropyVal = risk.circadian_entropy ?? 0

  if (risk.risk_level === "CRITICAL") {
    const sentences: string[] = []
    if (risk.velocity > 2.5) {
      sentences.push(`Work velocity has reached ${risk.velocity.toFixed(1)}x baseline, well above the 2.5 critical threshold.`)
    }
    if (risk.belongingness_score < 0.4) {
      sentences.push(`Social connection has dropped to ${connectionPct}%, falling below the 40% isolation threshold and indicating team withdrawal.`)
    } else if (connectionPct < 70) {
      sentences.push(`Social connection at ${connectionPct}% is below the 70% healthy benchmark.`)
    }
    if (entropyVal > 1.5) {
      sentences.push(`Schedule entropy is elevated at ${entropyVal.toFixed(2)}, pointing to irregular and potentially chaotic work hours.`)
    }
    if (sentences.length === 0) {
      sentences.push("Multiple risk signals detected across behavioral dimensions.")
    }
    sentences.push("Schedule an immediate 1:1 to discuss workload, check for deadline pressure, and explore schedule flexibility.")
    return sentences.join(" ")
  }

  if (risk.risk_level === "ELEVATED") {
    return `Early warning signals present. Connection index at ${connectionPct}% and velocity trending ${risk.velocity > 3 ? "above" : "at"} baseline. Proactive check-in advised.`
  }

  return `All indicators within healthy range. Velocity at ${risk.velocity.toFixed(1)}, connection at ${connectionPct}%, schedule entropy stable. No intervention needed.`
}

export function ProfileModal({ userHash, open, onOpenChange }: ProfileModalProps) {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  useEffect(() => {
    if (!open || !userHash) return
    setLoading(true)
    api.get<{ success: boolean; data: ProfileData }>(`/me/profile/${userHash}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open, userHash])

  const handleScheduleOneOnOne = async () => {
    if (!data) return
    setIsScheduling(true)
    const calendarWindow = window.open("about:blank", "_blank")
    try {
      const result = await scheduleBreak(data.user_hash)
      if (result?.calendar_link && calendarWindow) {
        calendarWindow.location.href = result.calendar_link
      } else if (calendarWindow) {
        calendarWindow.close()
      }
      toast.success(`1:1 scheduled with ${data.name}`, {
        description: result.message || "Calendar invite sent",
      })
    } catch {
      calendarWindow?.close()
      toast.error("Could not schedule 1:1", {
        description: "Please try again or use your calendar directly",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleAskSentinel = () => {
    if (!data) return
    onOpenChange(false)
    router.push(`/ask-sentinel?q=${encodeURIComponent(`How is ${data.name} doing?`)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Employee Profile</DialogTitle>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : data ? (() => {
          const risk = data.risk
          const velocity = risk?.velocity ?? 0
          const velocityStatus = velocity > 3 ? "High output" : velocity > 2 ? "Steady" : "Below baseline"
          const velocityColor = velocity > 3.5 ? "text-red-400" : velocity > 2.5 ? "text-amber-400" : "text-emerald-400"

          const connectionPct = risk ? Math.round(risk.belongingness_score * 100) : 0
          const connectionStatus = connectionPct >= 70 ? "Healthy" : connectionPct >= 40 ? "Low engagement" : "Isolated"
          const connectionColor = connectionPct >= 70 ? "text-emerald-400" : connectionPct >= 40 ? "text-amber-400" : "text-red-400"

          const confidencePct = risk ? Math.round(risk.confidence * 100) : 0
          const confidenceStatus = confidencePct >= 80 ? "High" : confidencePct >= 50 ? "Moderate" : "Low"
          const confidenceColor = confidencePct >= 80 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-red-400"

          const entropyVal = risk?.circadian_entropy ?? 0
          const entropyStatus = entropyVal > 1.5 ? "Irregular" : entropyVal > 0.8 ? "Variable" : "Stable"
          const entropyColor = entropyVal > 1.5 ? "text-red-400" : entropyVal > 0.8 ? "text-amber-400" : "text-emerald-400"

          const indicators = getActiveIndicators(data)
          const riskLevel = risk?.risk_level ?? "LOW"

          const skillsData = data.skills ?? {
            technical: 70,
            communication: 50,
            leadership: 40,
            collaboration: 80,
            adaptability: 60,
            creativity: 50,
          }

          return (
            <div className="p-10">
              {/* Header */}
              <DialogHeader className="pb-0">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground shrink-0">
                    {getInitials(data.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-semibold">
                      {data.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <p className="text-sm text-muted-foreground capitalize">
                        {data.role}
                      </p>
                      {risk && (
                        <Badge variant="outline" className={cn("text-[10px]", riskBadgeStyle(riskLevel))}>
                          {riskLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={isScheduling}
                      onClick={handleScheduleOneOnOne}
                    >
                      <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
                      {isScheduling ? "Scheduling..." : "Schedule 1:1"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={handleAskSentinel}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Ask Sentinel
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Metrics */}
              {risk && (
                <div className="mt-10">
                  <div className="bg-muted/30 rounded-xl p-6">
                    <div className="grid grid-cols-4 gap-8">
                      {[
                        { label: "Velocity", value: velocity.toFixed(1), status: velocityStatus, color: velocityColor },
                        { label: "Connection", value: `${connectionPct}%`, status: connectionStatus, color: connectionColor },
                        { label: "Confidence", value: `${confidencePct}%`, status: confidenceStatus, color: confidenceColor },
                        { label: "Entropy", value: entropyVal.toFixed(1), status: entropyStatus, color: entropyColor },
                      ].map((m) => (
                        <div key={m.label} className="p-5">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</p>
                          <p className="text-3xl font-mono font-semibold tabular-nums text-foreground mt-1.5 mb-1">{m.value}</p>
                          <p className={`text-xs ${m.color}`}>{m.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Indicators */}
              {indicators.length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Active Indicators</p>
                  <div className="flex flex-wrap gap-2">
                    {indicators.map((label) => (
                      <span
                        key={label}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          label === "Sustained Intensity"
                            ? "bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))]"
                            : "bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="opacity-10 mt-8" />

              {/* Skills Radar + AI Assessment */}
              <div className="mt-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Skills Radar</p>
                    <SkillsRadar data={skillsData} height={180} />
                  </div>

                  <div className="space-y-5">
                    <div className="bg-muted/20 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">AI Assessment</p>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {generateAssessment(data)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="opacity-10 mt-8" />

              {/* Privacy Note */}
              <div className="mt-8">
                <p className="text-[10px] text-muted-foreground/40 italic">
                  Analysis based on behavioral metadata only. No personal content accessed.
                </p>
              </div>
            </div>
          )
        })() : (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Failed to load profile
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
