"use client"

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Employee } from "@/types"

interface TeamDistributionProps {
  employees: Employee[]
}

function CustomBarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string } }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{data.payload.name}</p>
      <p className="text-xs text-muted-foreground">
        Velocity: <span className="font-mono font-semibold text-foreground">{data.value.toFixed(2)}</span>
      </p>
    </div>
  )
}

export function TeamDistribution({ employees }: TeamDistributionProps) {
  const barData = employees.map((emp) => ({
    name: emp.user_hash.slice(0, 6),
    velocity: emp.velocity,
    color:
      emp.risk_level === "CRITICAL"
        ? "hsl(var(--sentinel-critical))"
        : emp.risk_level === "ELEVATED"
          ? "hsl(var(--sentinel-elevated))"
          : "hsl(var(--sentinel-healthy))",
  }))

  const pieData = [
    {
      name: "Healthy",
      value: employees.filter((e) => e.risk_level === "LOW").length,
      color: "hsl(var(--sentinel-healthy))",
    },
    {
      name: "Elevated",
      value: employees.filter((e) => e.risk_level === "ELEVATED").length,
      color: "hsl(var(--sentinel-elevated))",
    },
    {
      name: "Critical",
      value: employees.filter((e) => e.risk_level === "CRITICAL").length,
      color: "hsl(var(--sentinel-critical))",
    },
  ].filter((d) => d.value > 0)

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Team Health Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Velocity Bar */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Velocity by User
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={false} />
                  <Bar dataKey="velocity" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Pie */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Distribution
            </p>
            <div className="flex h-44 items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="-ml-4 flex shrink-0 flex-col gap-3">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
