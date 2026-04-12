"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUsers } from "@/hooks/useUsers"
import { useTeamData } from "@/hooks/useTeamData"
import { toRiskLevel } from "@/types"

export function OrgHealthMap() {
  const { users, isLoading: usersLoading } = useUsers()
  const { data: teamData, isLoading: teamLoading } = useTeamData()

  const isLoading = usersLoading || teamLoading

  // Group users by role as a proxy for department (no department field in API)
  const byRole: Record<string, { members: number; riskCounts: Record<string, number> }> = {}
  users.forEach(u => {
    const dept = u.role || "Unknown"
    if (!byRole[dept]) byRole[dept] = { members: 0, riskCounts: {} }
    byRole[dept].members++
    const rl = toRiskLevel(u.risk_level)
    byRole[dept].riskCounts[rl] = (byRole[dept].riskCounts[rl] ?? 0) + 1
  })

  const departments = Object.entries(byRole).map(([name, data]) => {
    const criticalCount = data.riskCounts["CRITICAL"] ?? 0
    const elevatedCount = data.riskCounts["ELEVATED"] ?? 0
    const risk = criticalCount > 0 ? "critical" : elevatedCount > 0 ? "elevated" : "low"
    return { name, members: data.members, risk }
  })

  return (
    <Card className="col-span-1 lg:col-span-2 bg-background border-border">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-foreground">
          <span>Organization Map</span>
          <Badge variant="outline" className="text-xs" style={{borderColor: 'hsl(var(--sentinel-elevated) / 0.5)', color: 'hsl(var(--sentinel-elevated))'}}>
            Heatmap View
          </Badge>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Visualize risk distribution across roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="relative w-full h-[300px] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : departments.length === 0 ? (
          <div className="relative w-full h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            No team data available yet
          </div>
        ) : (
          <div className="relative w-full h-[300px] flex items-center justify-center p-4">
            {/* Central Hub */}
            <div className="absolute w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 shadow-xl shadow-black/50">
              <span className="font-bold text-foreground">HQ</span>
            </div>

            {/* Department Orbits */}
            <div className="absolute w-[80%] h-[80%] border border-dashed border-border rounded-full animate-pulse-slow opacity-30"></div>

            {/* Department Nodes */}
            <div className="grid grid-cols-4 gap-8 w-full h-full relative z-20">
              {departments.slice(0, 8).map((dept, i) => (
                <div
                  key={dept.name}
                  className={`
                    relative group flex flex-col items-center justify-center
                    transition-all duration-300 hover:scale-110 cursor-pointer
                    ${dept.risk === 'critical' ? 'animate-pulse' : ''}
                  `}
                  style={{
                    transform: `translate(${Math.sin(i) * 20}px, ${Math.cos(i) * 20}px)`
                  }}
                >
                  <div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm
                      ${dept.risk === 'critical' ? 'bg-red-950/40 border-red-500 shadow-red-900/20' :
                        dept.risk === 'elevated' ? 'bg-amber-950/40 border-amber-500 shadow-amber-900/20' :
                        'bg-teal-950/40 border-teal-500 shadow-teal-900/20'}
                    `}
                  >
                    <span className="font-bold text-xs text-foreground">{dept.members}</span>
                  </div>
                  <div className="mt-2 text-xs font-medium text-foreground bg-background/60 px-2 py-0.5 rounded-full border border-border">
                    {dept.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
