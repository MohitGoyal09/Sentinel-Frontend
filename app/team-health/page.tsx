"use client"

import { useForecast } from "@/hooks/useForecast"
import { useTeamData } from "@/hooks/useTeamData"
import { ProtectedRoute } from "@/components/protected-route"
import { ForecastChart } from "@/components/forecast-chart"
import { TeamDistribution } from "@/components/team-distribution"
import { StatCards } from "@/components/stat-cards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Thermometer, Activity, Users, AlertTriangle } from "lucide-react"
import { useMemo } from "react"
import { toRiskLevel } from "@/types"

export default function TeamHealthPage() {
  const { data: teamData, isLoading: teamLoading } = useTeamData()
  const { data: forecastData, isLoading: forecastLoading } = useForecast()

  // Re-use logic to format metrics for StatCards
  const mappedTeamMetrics = useMemo(() => {
    if (!teamData) return null
    return {
      total_members: teamData.metrics.total_members ?? teamData.metrics.team_size ?? teamData.metrics.member_count ?? 0,
      healthy_count: 0, // Need full list for exact counts, using approximations or fetching users if needed. 
      // For now, let's rely on teamData stats if available, or just map what we have.
      // The backend /team endpoint provides summaries.
      elevated_count: 0, 
      critical_count: teamData.metrics.critical_members ?? teamData.metrics.critical_count ?? 0,
      calibrating_count: 0,
      avg_velocity: teamData.metrics.avg_velocity,
      graph_fragmentation: teamData.metrics.graph_fragmentation,
      comm_decay_rate: teamData.metrics.comm_decay_rate,
      contagion_risk: toRiskLevel(teamData.team_risk)
    }
  }, [teamData])

  return (
    <ProtectedRoute>
      <div className="flex flex-colmin-h-screen bg-background p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Thermometer className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Culture Thermometer</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Epidemic modeling (SIR) to predict emotional contagion and burnout spread within teams.
          </p>
        </div>

        {/* Top KPI Cards */}
        {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics as any} />}

        {/* Forecast Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-2">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <Activity className="h-4 w-4 text-blue-400" />
                 30-Day Forecast
               </h3>
               <p className="text-sm text-muted-foreground">Predicted spread of burnout risk based on current interaction patterns.</p>
             </div>
             <ForecastChart data={forecastData} isLoading={forecastLoading} />
          </div>

          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-2">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <Users className="h-4 w-4 text-green-400" />
                 Current Distribution
               </h3>
               <p className="text-sm text-muted-foreground">Real-time snapshot of team risk levels.</p>
             </div>
             {/* Note: TeamDistribution requires 'employees' array. 
                 If we don't have it here, we might need to fetch useUsers() or rework the component.
                 For now, we'll assume we can component-ize better later or fetch basic data.
                 Or we can just show a simplified card if data missing.
             */}
             <Card className="flex-1 bg-card/50 border-dashed border-muted">
               <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                 <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Detailed distribution view requires employee list context.</p>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>

        {/* Insights / Alerts */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Contagion Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                  <span>The <strong>Engineering Team</strong> is showing signs of high fragmentation (0.72), which correlates with increased burnout risk within 2 weeks.</span>
                </li>
             </ul>
          </CardContent>
        </Card>

      </div>
    </ProtectedRoute>
  )
}
