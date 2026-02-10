'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface SIRForecastData {
  status: string
  risk_level?: string
  r0?: number
  peak_day?: number
  peak_infected?: number
  forecast?: {
    days: number[]
    susceptible: number[]
    infected: number[]
    recovered: number[]
  }
}

interface ForecastChartProps {
  data: SIRForecastData | null
  isLoading?: boolean
}

export function ForecastChart({ data, isLoading }: ForecastChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex h-80 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.status !== 'OK' || !data.forecast) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Contagion Forecast</CardTitle>
        </CardHeader>
        <CardContent className="flex h-60 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {data?.status === 'INSUFFICIENT_DATA' 
              ? 'Need at least 3 members and 1 at-risk person for prediction' 
              : 'No forecast data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for Recharts
  const chartData = data.forecast.days.map((day, i) => ({
    day,
    Susceptible: data.forecast!.susceptible[i],
    'At Risk': data.forecast!.infected[i],
    Recovered: data.forecast!.recovered[i],
  }))

  const riskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-[hsl(var(--sentinel-critical))]'
      case 'ELEVATED': return 'text-[hsl(var(--sentinel-elevated))]'
      default: return 'text-[hsl(var(--sentinel-healthy))]'
    }
  }

  const riskBadgeVariant = (level: string): 'destructive' | 'secondary' | 'default' => {
    switch (level) {
      case 'CRITICAL': return 'destructive'
      case 'ELEVATED': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">SIR Contagion Forecast</CardTitle>
            <CardDescription className="text-xs">30-day burnout spread prediction</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">R₀</p>
              <p className={`text-lg font-bold ${data.r0 && data.r0 > 1 ? 'text-[hsl(var(--sentinel-critical))]' : 'text-[hsl(var(--sentinel-healthy))]'}`}>
                {data.r0?.toFixed(2)}
              </p>
            </div>
            <Badge variant={riskBadgeVariant(data.risk_level || 'LOW')}>
              {data.risk_level}
            </Badge>
          </div>
        </div>
        
        {data.peak_day !== undefined && data.peak_infected !== undefined && (
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>Peak: Day {data.peak_day}</span>
            <span>Max at risk: {data.peak_infected.toFixed(1)} people</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(v) => `D${v}`}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              
              {data.peak_day !== undefined && (
                <ReferenceLine 
                  x={data.peak_day} 
                  stroke="hsl(var(--sentinel-critical))" 
                  strokeDasharray="5 5"
                  label={{ value: 'Peak', position: 'top', fontSize: 10 }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="Susceptible" 
                stroke="hsl(var(--sentinel-healthy))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="At Risk" 
                stroke="hsl(var(--sentinel-critical))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="Recovered" 
                stroke="hsl(var(--sentinel-info))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>R₀ (R-naught)</strong> indicates contagion potential. 
            {data.r0 && data.r0 > 1 
              ? ' Values above 1.0 mean burnout risk will spread across the team.' 
              : ' Values below 1.0 mean risk is contained.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
