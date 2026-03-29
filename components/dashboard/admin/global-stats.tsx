"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Shield, Cpu, RefreshCw } from "lucide-react"

export function GlobalStatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-background shadow-lg" style={{borderColor: 'hsl(var(--sentinel-healthy) / 0.2)', boxShadow: '0 4px 6px -1px hsl(var(--sentinel-healthy) / 0.05)'}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" style={{color: 'hsl(var(--sentinel-healthy))'}}>Total Org Health</CardTitle>
          <Activity className="h-4 w-4" style={{color: 'hsl(var(--sentinel-healthy))'}} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">94%</div>
          <p className="text-xs text-muted-foreground mt-1">
            +2.5% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-background shadow-lg" style={{borderColor: 'hsl(var(--primary) / 0.2)', boxShadow: '0 4px 6px -1px hsl(var(--primary) / 0.05)'}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" style={{color: 'hsl(var(--primary))'}}>Active Engines</CardTitle>
          <RefreshCw className="h-4 w-4 animate-spin-slow" style={{color: 'hsl(var(--primary))'}} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">4/4</div>
          <p className="text-xs text-muted-foreground mt-1">
            Running optimally
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-background shadow-lg" style={{borderColor: 'hsl(var(--sentinel-elevated) / 0.2)', boxShadow: '0 4px 6px -1px hsl(var(--sentinel-elevated) / 0.05)'}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" style={{color: 'hsl(var(--sentinel-elevated))'}}>System Load</CardTitle>
          <Cpu className="h-4 w-4" style={{color: 'hsl(var(--sentinel-elevated))'}} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">Normal</div>
          <p className="text-xs text-muted-foreground mt-1">
            CPU: 42% | Mem: 3.2GB
          </p>
        </CardContent>
      </Card>

      <Card className="bg-background shadow-lg" style={{borderColor: 'hsl(var(--sentinel-info) / 0.2)', boxShadow: '0 4px 6px -1px hsl(var(--sentinel-info) / 0.05)'}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" style={{color: 'hsl(var(--sentinel-info))'}}>Active Users</CardTitle>
          <Shield className="h-4 w-4" style={{color: 'hsl(var(--sentinel-info))'}} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">26</div>
          <p className="text-xs text-muted-foreground mt-1">
            100% compliant
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
