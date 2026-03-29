import { useMemo } from "react"
import { motion } from "framer-motion"
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
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Employee } from "@/types"

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

  // Mock data regarding insights - In a real app, this would come from an API
  const insights = useMemo(() => ([
    {
      id: 1,
      type: "risk",
      title: "Elevated Burnout Risk",
      description: "Working hours have extended by 2.5h on average over the last 10 days.",
      severity: "high",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      type: "pattern",
      title: "Communication Isolation",
      description: "Interactions with team members dropped by 45% this week.",
      severity: "medium",
      timestamp: "Yesterday"
    },
    {
      id: 3,
      type: "positive",
      title: "Velocity Spike",
      description: "Commit volume is in the top 5% of the organization.",
      severity: "low",
      timestamp: "3 days ago"
    }
  ]), [employee.user_hash])

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
      case "CRITICAL": return {color: 'hsl(var(--sentinel-critical))'}
      case "ELEVATED": return {color: 'hsl(var(--sentinel-elevated))'}
      case "LOW": return {color: 'hsl(var(--sentinel-healthy))'}
      default: return {}
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "risk": return <AlertTriangle className="h-4 w-4" style={{color: 'hsl(var(--sentinel-critical))'}} />
      case "pattern": return <BrainCircuit className="h-4 w-4" style={{color: 'hsl(var(--primary))'}} />
      case "positive": return <Zap className="h-4 w-4" style={{color: 'hsl(var(--sentinel-elevated))'}} />
      default: return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

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
                {isAnonymized && <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded ml-2"><Lock className="h-3 w-3"/> Anonymized View</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={onToggleAnonymity} className="gap-2">
              {isAnonymized ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isAnonymized ? "Reveal Identity" : "Anonymize"}
           </Button>
           <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50">
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
            <p className="text-xs text-muted-foreground mt-2">+12% from last week</p>
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
                 <div className="h-full w-[75%]" style={{backgroundColor: 'hsl(var(--sentinel-healthy))'}} />
             </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">42.5h</div>
            <p className="text-xs text-muted-foreground mt-1">Avg. active time</p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{color: 'hsl(var(--sentinel-elevated))'}}>
               <AlertCircle className="h-3 w-3" /> Overtime detected
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belongingness</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{(employee.belongingness_score * 100).toFixed(0)}/100</div>
             <p className="text-xs text-muted-foreground mt-1">Sentiment analysis score</p>
             <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
                 <div className="h-full w-[65%]" style={{backgroundColor: 'hsl(var(--sentinel-info))'}} />
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart / Detailed Analysis */}
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
             <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg bg-muted/5">
                <p className="text-muted-foreground text-sm">Interactive Activity Heatmap Placeholder</p>
                {/* In a real implementation, a Recharts ComposedChart would go here */}
             </div>
             
             <div className="grid grid-cols-3 gap-4 mt-6">
                 <div className="p-4 rounded-lg border" style={{backgroundColor: 'hsl(var(--sentinel-critical) / 0.05)', borderColor: 'hsl(var(--sentinel-critical) / 0.2)'}}>
                   <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color: 'hsl(var(--sentinel-critical))'}}>Risk Factor 1</p>
                   <p className="text-sm font-medium text-foreground">Late Night Activity</p>
                   <p className="text-xs text-muted-foreground mt-1">Consistently active between 11 PM - 2 AM.</p>
                </div>
                 <div className="p-4 rounded-lg border" style={{backgroundColor: 'hsl(var(--sentinel-elevated) / 0.05)', borderColor: 'hsl(var(--sentinel-elevated) / 0.2)'}}>
                   <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color: 'hsl(var(--sentinel-elevated))'}}>Risk Factor 2</p>
                   <p className="text-sm font-medium text-foreground">Weekend Commitments</p>
                   <p className="text-xs text-muted-foreground mt-1">Code pushes on 3 consecutive weekends.</p>
                </div>
                 <div className="p-4 rounded-lg border" style={{backgroundColor: 'hsl(var(--sentinel-info) / 0.05)', borderColor: 'hsl(var(--sentinel-info) / 0.2)'}}>
                   <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color: 'hsl(var(--sentinel-info))'}}>Positive Signal</p>
                   <p className="text-sm font-medium text-foreground">Strong Collaboration</p>
                   <p className="text-xs text-muted-foreground mt-1">High participation in code reviews.</p>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Generated Insights Feed */}
        <Card className="col-span-1 border-border bg-card/50 backdrop-blur-sm flex flex-col">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" style={{color: 'hsl(var(--primary))'}} />
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
                    
                    <div className="p-3 rounded-lg border border-dashed border-border flex items-center justify-center text-center">
                       <p className="text-xs text-muted-foreground italic">Analyzing new data patterns...</p>
                    </div>
                 </div>
              </ScrollArea>
           </CardContent>
        </Card>

      </div>
    </div>
  )
}
