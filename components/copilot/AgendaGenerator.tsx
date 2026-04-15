"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sparkles, Calendar, Edit3, X, Loader2, MessageSquarePlus, AlertTriangle, Heart, Lightbulb, Clock, Save, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { generateAgenda, scheduleBreak, type AgendaResponse } from "@/lib/api"

interface AgendaGeneratorProps {
  userHash: string
  userName: string
  riskLevel: string
  pattern?: string
  context?: string
}

interface TalkingPoint {
  id: number
  text: string
  type: string
}

export function AgendaGenerator({
  userHash,
  userName,
  riskLevel,
  pattern = "Late nights +3 days this week",
  context = "Post-sprint, unexplained",
}: AgendaGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [editablePoints, setEditablePoints] = useState<TalkingPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setExpanded(true)
    try {
      const response = await generateAgenda(userHash)
      setAgenda(response)
      setEditablePoints(response.talking_points.map((tp, idx) => ({
        id: tp.id || idx + 1,
        text: tp.text,
        type: tp.type || "question"
      })))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate agenda"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setAgenda(null)
    setExpanded(false)
    setIsEditing(false)
  }

  const handleSchedule = async () => {
    // Open window synchronously in click handler (before async gap)
    const calendarWindow = window.open("about:blank", "_blank")
    try {
      const result = await scheduleBreak(userHash)
      if (result?.calendar_link && calendarWindow) {
        calendarWindow.location.href = result.calendar_link
      } else if (calendarWindow) {
        calendarWindow.close()
      }
      toast.success(`1:1 meeting with ${userName} scheduled!`)
    } catch {
      calendarWindow?.close()
      toast.error("Failed to schedule meeting")
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
    if (agenda) {
      setAgenda({
        ...agenda,
        talking_points: editablePoints.map(p => ({
          id: p.id,
          text: p.text,
          type: p.type
        }))
      })
    }
  }

  const handleAddPoint = () => {
    setEditablePoints([...editablePoints, {
      id: editablePoints.length === 0 ? 1 : Math.max(...editablePoints.map(p => p.id)) + 1,
      text: "",
      type: "question"
    }])
  }

  const handleDeletePoint = (id: number) => {
    setEditablePoints(editablePoints.filter(p => p.id !== id))
  }

  const handlePointChange = (id: number, text: string) => {
    setEditablePoints(editablePoints.map(p => 
      p.id === id ? { ...p, text } : p
    ))
  }

  const isElevatedOrHigher = riskLevel === "ELEVATED" || riskLevel === "CRITICAL"
  const riskBadgeColor =
    riskLevel === "CRITICAL"
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : "bg-amber-500/10 text-amber-500 border-amber-500/20"

  return (
    <Card className={cn(
      "border-border bg-card shadow-sm transition-all duration-300 overflow-hidden",
      isElevatedOrHigher && "border-amber-500/30"
    )}>
      <CardHeader className={cn(
        "pb-3 transition-colors",
        isElevatedOrHigher && agenda && "bg-amber-500/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg",
              isElevatedOrHigher 
                ? "bg-amber-500" 
                : "bg-primary"
            )}>
              {isElevatedOrHigher ? (
                <AlertTriangle className="h-5 w-5 text-white" />
              ) : (
                <Sparkles className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Safety Valve
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                AI-powered 1:1 agenda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] font-semibold", riskBadgeColor)}>
              {riskLevel}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
              <Sparkles className="mr-1 h-3 w-3" />
              AI
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 p-4">
        {!expanded ? (
          <>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-medium text-foreground">{userName}</span>
              </div>
              {pattern && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{pattern}</span>
                </div>
              )}
              {context && (
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{context}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className={cn(
                "w-full gap-2 shadow-lg",
                isElevatedOrHigher 
                  ? "bg-amber-500 hover:bg-amber-600 hover:shadow-amber-500/20" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating agenda...
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-4 w-4" />
                  Generate 1:1 Agenda
                </>
              )}
            </Button>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="mr-1.5 h-4 w-4 inline text-amber-500" />
                  AI-Generated Talking Points
                </p>
                {agenda && (
                  <Badge variant="outline" className="text-[10px]">
                    {agenda.talking_points.length} points
                  </Badge>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 animate-pulse items-center justify-center rounded-full bg-muted" />
                      <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : agenda ? (
                isEditing ? (
                  <div className="flex flex-col gap-3">
                    {editablePoints.map((point, idx) => (
                      <div key={point.id} className="flex gap-2 items-start">
                        <span className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium mt-1",
                          isElevatedOrHigher 
                            ? "bg-amber-500/10 text-amber-600" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {point.id}
                        </span>
                        <Input
                          value={point.text}
                          onChange={(e) => handlePointChange(point.id, e.target.value)}
                          className="flex-1 text-sm"
                          placeholder="Enter talking point..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeletePoint(point.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddPoint}
                      className="gap-1 self-start"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Point
                    </Button>
                  </div>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {agenda.talking_points.map((point, idx) => (
                      <li key={point.id || idx} className="flex gap-3">
                        <span className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          isElevatedOrHigher
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-primary/10 text-primary"
                        )}>
                          {point.id}
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">
                          &ldquo;{point.text}&rdquo;
                        </span>
                      </li>
                    ))}
                  </ol>
                )
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : null}
            </div>

            {agenda && (
              <div className={cn(
                "rounded-lg p-4 text-sm",
                isElevatedOrHigher 
                  ? "bg-amber-500/10 border border-amber-500/20" 
                  : "bg-primary/5 border border-primary/20"
              )}>
                <div className="flex items-start gap-2">
                  <Heart className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    isElevatedOrHigher ? "text-amber-500" : "text-primary"
                  )} />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Tip: </span>
                    Start with open-ended questions and listen actively. Focus on understanding their perspective before offering solutions.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveEdit}
                    size="sm"
                    className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSchedule}
                    size="sm"
                    className={cn(
                      "flex-1 gap-1",
                      isElevatedOrHigher 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Schedule
                  </Button>
                  <Button
                    onClick={handleEdit}
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SafetyValveCard({
  userHash,
  userName,
  riskLevel,
  pattern,
  context,
  children,
}: {
  userHash: string
  userName: string
  riskLevel: string
  pattern?: string
  context?: string
  children?: React.ReactNode
}) {
  const [showAI, setShowAI] = useState(false)

  return (
    <Card className="overflow-hidden border-border">
      <div className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        riskLevel === "CRITICAL" && "bg-red-500/5",
        riskLevel === "ELEVATED" && "bg-amber-500/5",
        !riskLevel && "bg-muted/30"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            riskLevel === "CRITICAL" && "bg-red-500/10",
            riskLevel === "ELEVATED" && "bg-amber-500/10",
            !riskLevel && "bg-muted"
          )}>
            {riskLevel === "CRITICAL" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : riskLevel === "ELEVATED" ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <span className="text-sm font-semibold">
              Safety Valve
            </span>
            <p className="text-xs text-muted-foreground">
              {userName} • {riskLevel || "Monitoring"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAI(!showAI)}
          className={cn(
            "gap-1 text-xs",
            showAI && (riskLevel === "CRITICAL" 
              ? "bg-red-500/10 text-red-600" 
              : "bg-amber-500/10 text-amber-600")
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </Button>
      </div>
      <CardContent className="p-4">
        {showAI ? (
          <AgendaGenerator
            userHash={userHash}
            userName={userName}
            riskLevel={riskLevel}
            pattern={pattern}
            context={context}
          />
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {pattern && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Pattern: </span> 
                {pattern}
              </p>
            )}
            {context && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Context: </span> 
                {context}
              </p>
            )}
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
