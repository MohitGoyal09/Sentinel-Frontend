"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Beaker, Play, RotateCcw, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimulationPanelProps {
  onInjectEvent?: (eventType: string) => void
  onRunSimulation?: (persona: string) => void
}


const personas = [
  {
    id: "alex_burnout",
    label: "Alex (Burnout Pattern)",
    risk: "CRITICAL" as const,
    description: "Late nights escalating, social withdrawal, no recovery days",
  },
  {
    id: "sarah_gem",
    label: "Sarah (Hidden Gem)",
    risk: "LOW" as const,
    description: "Low visibility, high betweenness, bridges disconnected teams",
  },
  {
    id: "jordan_steady",
    label: "Jordan (Control)",
    risk: "LOW" as const,
    description: "Stable 9-6 pattern, flat velocity, consistent baseline",
  },
  {
    id: "maria_contagion",
    label: "Maria (Contagion)",
    risk: "ELEVATED" as const,
    description: "Team fragmentation, communication decay spreading",
  },
]

const injectionTypes = [
  { id: "late_commit", label: "Late Night Commit", icon: Zap, impact: "Increases velocity + entropy" },
  { id: "missed_standup", label: "Missed Standup", icon: AlertTriangle, impact: "Reduces belongingness" },
  { id: "weekend_work", label: "Weekend Work", icon: Zap, impact: "Adds overwork indicator" },
  { id: "pr_review", label: "Helpful PR Review", icon: Beaker, impact: "Increases unblocking count" },
]

export function SimulationPanel({ onInjectEvent, onRunSimulation }: SimulationPanelProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>("")
  const [injectionLog, setInjectionLog] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const handleInject = (type: string) => {
    const now = new Date().toLocaleTimeString()
    setInjectionLog((prev) => [`[${now}] Injected: ${type}`, ...prev.slice(0, 9)])
    onInjectEvent?.(type)
  }

  const handleRunSimulation = () => {
    if (!selectedPersona) return
    setIsRunning(true)
    onRunSimulation?.(selectedPersona)
    const persona = personas.find((p) => p.id === selectedPersona)
    const now = new Date().toLocaleTimeString()
    setInjectionLog((prev) =>
      [
        `[${now}] Simulation started: ${persona?.label}`,
        `[${now}] Generating 30 days of synthetic events...`,
        `[${now}] Running Safety Valve analysis...`,
        `[${now}] Computing network centrality...`,
        ...prev.slice(0, 5),
      ]
    )
    setTimeout(() => {
      setIsRunning(false)
      const done = new Date().toLocaleTimeString()
      setInjectionLog((prev) =>
        [`[${done}] Simulation complete. Risk scores updated.`, ...prev].slice(0, 10)
      )
    }, 2000)
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Simulation Controls</CardTitle>
          <Badge variant="outline" className="border-[hsl(var(--sentinel-info))]/20 bg-[hsl(var(--sentinel-info))]/6 text-[10px] text-[hsl(var(--sentinel-info))]">
            <Beaker className="mr-1 h-2.5 w-2.5" />
            Demo Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Persona Selector */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Create Digital Twin
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPersona(p.id)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border px-4 py-3 text-left transition-all duration-150",
                  selectedPersona === p.id
                    ? "border-primary/30 bg-primary/4 shadow-sm"
                    : "border-border bg-muted/30 hover:border-border hover:bg-muted/50"
                )}
              >
                <div className="flex w-full items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      p.risk === "CRITICAL"
                        ? "bg-[hsl(var(--sentinel-critical))]"
                        : p.risk === "ELEVATED"
                          ? "bg-[hsl(var(--sentinel-elevated))]"
                          : "bg-[hsl(var(--sentinel-healthy))]"
                    )}
                  />
                  <span className="text-xs font-semibold text-foreground">{p.label}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
          <Button
            onClick={handleRunSimulation}
            disabled={!selectedPersona || isRunning}
            className="mt-1 h-10 rounded-lg"
          >
            {isRunning ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </>
            )}
          </Button>
        </div>

        {/* Inject Events */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inject Event (Real-Time)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {injectionTypes.map((inj) => (
              <Button
                key={inj.id}
                variant="outline"
                size="sm"
                onClick={() => handleInject(inj.label)}
                className="flex h-auto flex-col items-start gap-1 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <inj.icon className="h-3.5 w-3.5 text-[hsl(var(--sentinel-info))]" />
                  <span className="text-xs font-semibold">{inj.label}</span>
                </div>
                <p className="text-[10px] font-normal text-muted-foreground">{inj.impact}</p>
              </Button>
            ))}
          </div>
        </div>

        {/* Log */}
        {injectionLog.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Activity Log
            </p>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
              {injectionLog.map((log, i) => (
                <p key={`log-${i}`} className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
