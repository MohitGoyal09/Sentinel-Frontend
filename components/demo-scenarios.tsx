"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Flame, Gem, Heart, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPersona } from "@/lib/api"
import { PersonaType } from "@/types"

interface DemoScenario {
  id: string
  icon: React.ElementType
  title: string
  description: string
  personaType: PersonaType
  color: string
}

const scenarios: DemoScenario[] = [
  {
    id: "burnout",
    icon: Flame,
    title: "Burnout Detection",
    description: "Watch how we catch burnout 2 weeks before it peaks",
    personaType: "alex_burnout",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/60",
  },
  {
    id: "talent",
    icon: Gem,
    title: "Hidden Talent",
    description: "See how we identify people enabling the team",
    personaType: "sarah_gem",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 hover:border-amber-500/60",
  },
  {
    id: "culture",
    icon: Heart,
    title: "Culture Health",
    description: "Watch how team mood affects everyone",
    personaType: "maria_contagion",
    color: "from-primary/20 to-primary/10 border-primary/30 hover:border-primary/60",
  },
]

export function DemoScenarios() {
  const router = useRouter()
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleScenarioClick = async (scenario: DemoScenario) => {
    setLoadingScenario(scenario.id)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 15
      })
    }, 200)

    try {
      const demoEmail = `demo+${scenario.id}@algoquest.ai`
      const result = await createPersona(demoEmail, scenario.personaType)

      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        router.push(`/team?highlight=${result.user_hash}`)
      }, 500)
    } catch (error) {
      console.error("Failed to create persona:", error)
      clearInterval(progressInterval)
      setLoadingScenario(null)
      setProgress(0)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {scenarios.map((scenario) => {
        const Icon = scenario.icon
        const isLoading = loadingScenario === scenario.id

        return (
          <Card
            key={scenario.id}
            className={cn(
              "relative cursor-pointer overflow-hidden border-2 bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
              isLoading ? "pointer-events-none" : "cursor-pointer",
              scenario.color
            )}
            onClick={() => !isLoading && handleScenarioClick(scenario)}
          >
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                <Progress value={progress} className="mb-2 h-2 w-32" />
                <p className="text-xs text-muted-foreground">
                  {progress < 30
                    ? "Creating digital twin..."
                    : progress < 60
                      ? "Generating behavioral patterns..."
                      : progress < 90
                        ? "Computing risk signals..."
                        : "Almost ready..."}
                </p>
              </div>
            )}
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div
                className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  scenario.id === "burnout"
                    ? "bg-orange-500"
                    : scenario.id === "talent"
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
              >
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{scenario.title}</h3>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
              {!isLoading && (
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  Try it now
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
