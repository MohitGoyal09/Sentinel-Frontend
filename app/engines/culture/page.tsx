"use client"

import { useState, useMemo } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  Smile,
  Frown,
  Meh,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Moon,
  Sun,
  Zap,
  Coffee,
  Calendar,
  Activity,
  HeartHandshake,
  MessageCircle,
  PartyPopper,
  Sparkles,
  BarChart3,
  RefreshCw,
  Info
} from "lucide-react"

import { useUsers } from "@/hooks/useUsers"

interface MoodData {
  date: string
  score: number
  positive: number
  neutral: number
  negative: number
}

interface CultureMetric {
  label: string
  value: number
  change: number
  icon: React.ElementType
}

function CultureContent() {
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "balance">("overview")
  const { users, isLoading: usersLoading } = useUsers()

  const teamSentiment = useMemo(() => {
    const sentiments = ["positive", "neutral", "negative"]
    const weights = [0.45, 0.35, 0.20]
    const randomSentiment = Math.random()
    let sentiment: string
    
    if (randomSentiment < 0.45) sentiment = "positive"
    else if (randomSentiment < 0.80) sentiment = "neutral"
    else sentiment = "negative"
    
    return {
      overall: sentiment,
      score: 65 + Math.random() * 25,
      breakdown: {
        positive: 45 + Math.random() * 30,
        neutral: 25 + Math.random() * 25,
        negative: 5 + Math.random() * 15
      }
    }
  }, [])

  const cultureTemperature = useMemo(() => {
    const temp = 60 + Math.random() * 30
    let status: "hot" | "warm" | "cool" | "cold"
    let message: string
    
    if (temp >= 75) {
      status = "hot"
      message = "Team culture is thriving"
    } else if (temp >= 55) {
      status = "warm"
      message = "Healthy team culture with room to grow"
    } else if (temp >= 35) {
      status = "cool"
      message = "Culture needs attention"
    } else {
      status = "cold"
      message = "Critical: Culture intervention needed"
    }
    
    return { value: temp, status, message }
  }, [])

  const collaborationTrends = useMemo((): CultureMetric[] => {
    return [
      { label: "Cross-team Projects", value: 72 + Math.random() * 20, change: 5 + Math.random() * 10, icon: Users },
      { label: "Knowledge Sharing", value: 65 + Math.random() * 25, change: -2 + Math.random() * 8, icon: MessageCircle },
      { label: "Team Bonding Events", value: 50 + Math.random() * 30, change: 10 + Math.random() * 15, icon: PartyPopper },
      { label: "Peer Recognition", value: 60 + Math.random() * 30, change: 3 + Math.random() * 12, icon: HeartHandshake }
    ]
  }, [])

  const workLifeBalance = useMemo((): CultureMetric[] => {
    return [
      { label: "Avg. Work Hours", value: 38 + Math.random() * 12, change: -1 + Math.random() * 3, icon: Clock },
      { label: "PTO Utilization", value: 60 + Math.random() * 30, change: 5 + Math.random() * 10, icon: Calendar },
      { label: "After-hours Activity", value: 15 + Math.random() * 20, change: -3 + Math.random() * 6, icon: Moon },
      { label: "Meeting Load", value: 45 + Math.random() * 25, change: -2 + Math.random() * 4, icon: Coffee }
    ]
  }, [])

  const moodOverTime = useMemo((): MoodData[] => {
    const data: MoodData[] = []
    const today = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const baseScore = 60 + Math.random() * 20
      const trend = (30 - i) * 0.2
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.min(100, Math.max(0, baseScore + trend)),
        positive: 30 + Math.random() * 30,
        neutral: 20 + Math.random() * 25,
        negative: 5 + Math.random() * 15
      })
    }
    
    return data
  }, [])

  const recentMoodHighlights = useMemo(() => {
    return [
      { emoji: "🎉", text: "Team celebration yesterday", type: "positive" },
      { emoji: "💪", text: "Successful project launch", type: "positive" },
      { emoji: "☕", text: "New coffee machine installed", type: "neutral" },
      { emoji: "🏃", text: "Team building event planned", type: "positive" },
      { emoji: "😰", text: "Deadline pressure noted", type: "negative" }
    ].slice(0, 4)
  }, [])

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return Smile
      case "negative": return Frown
      default: return Meh
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const SentimentIcon = getSentimentIcon(teamSentiment.overall)

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-8 p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-critical))]/15 border border-[hsl(var(--sentinel-critical))]/20">
                <Heart className="h-6 w-6 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Culture Engine</h2>
                <p className="text-sm text-muted-foreground">Team sentiment & workplace wellness</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px] border-[hsl(var(--sentinel-healthy))]/30 text-[hsl(var(--sentinel-healthy))] bg-[hsl(var(--sentinel-healthy))]/10">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="glass-card-elevated relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[hsl(var(--sentinel-critical))]/3" />
            
            <div className="relative grid gap-10 p-8 md:grid-cols-2 lg:gap-14">
              {/* Temperature Gauge */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--sentinel-critical))]/10 blur-3xl" />
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {cultureTemperature.value.toFixed(0)}°
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                        Temperature
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-medium text-white bg-[hsl(var(--primary))]">
                    {cultureTemperature.status.charAt(0).toUpperCase() + cultureTemperature.status.slice(1)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
                  <span className="text-sm font-medium text-[hsl(var(--sentinel-critical))]">{cultureTemperature.message}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col justify-center gap-4">
                {/* Team Sentiment */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                      <SentimentIcon className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Team Sentiment</p>
                      <p className="text-[11px] text-muted-foreground">Overall mood analysis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono tabular-nums text-[hsl(var(--sentinel-critical))] capitalize">{teamSentiment.overall}</p>
                    <p className="text-[10px] text-muted-foreground">Score: {teamSentiment.score.toFixed(0)}</p>
                  </div>
                </div>

                {/* Active Members */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                      <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Active Members</p>
                      <p className="text-[11px] text-muted-foreground">Team size</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{users.length || 24}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                </div>

                {/* Recent Highlights */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-gem))]/10">
                      <Sparkles className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recent Highlights</p>
                      <p className="text-[11px] text-muted-foreground">Latest team moments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-gem))]">{recentMoodHighlights.length}</p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-border">
            {(["overview", "trends", "balance"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[hsl(var(--primary))] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "overview" && <Heart className="h-4 w-4" />}
                {tab === "trends" && <TrendingUp className="h-4 w-4" />}
                {tab === "balance" && <Moon className="h-4 w-4" />}
                {tab === "overview" ? "Overview" : tab === "trends" ? "Trends" : "Work-Life Balance"}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sentiment Breakdown */}
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Heart className="h-5 w-5 text-[hsl(var(--sentinel-critical))]" />
                      Sentiment Breakdown
                    </CardTitle>
                    <CardDescription>Detailed analysis of team mood</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Overall Score Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Overall Score</span>
                          <span className="font-bold font-mono tabular-nums text-[hsl(var(--sentinel-critical))]">{teamSentiment.score.toFixed(0)}/100</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[hsl(var(--sentinel-critical))] rounded-full transition-all duration-500"
                            style={{ width: `${teamSentiment.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Sentiment Distribution */}
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="text-center p-4 rounded-xl metric-card">
                          <Smile className="h-7 w-7 mx-auto mb-2 text-[hsl(var(--sentinel-healthy))]" />
                          <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-healthy))]">{teamSentiment.breakdown.positive.toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground">Positive</p>
                        </div>
                        <div className="text-center p-4 rounded-xl metric-card">
                          <Meh className="h-7 w-7 mx-auto mb-2 text-[hsl(var(--sentinel-elevated))]" />
                          <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-elevated))]">{teamSentiment.breakdown.neutral.toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground">Neutral</p>
                        </div>
                        <div className="text-center p-4 rounded-xl metric-card">
                          <Frown className="h-7 w-7 mx-auto mb-2 text-[hsl(var(--sentinel-critical))]" />
                          <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-critical))]">{teamSentiment.breakdown.negative.toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground">Negative</p>
                        </div>
                      </div>

                      {/* Recent Highlights */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Recent Highlights</h4>
                        <div className="space-y-2">
                          {recentMoodHighlights.map((highlight, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                            >
                              <span className="text-lg">{highlight.emoji}</span>
                              <span className="text-sm text-foreground flex-1">{highlight.text}</span>
                              <Badge 
                                variant="secondary" 
                                className={
                                  highlight.type === "positive" ? "text-[10px] bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]" :
                                  highlight.type === "negative" ? "text-[10px] bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]" :
                                  "text-[10px] bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))]"
                                }
                              >
                                {highlight.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>

              {/* Culture Metrics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Culture Metrics</h3>
                </div>

                <div className="space-y-3">
                  {collaborationTrends.map((metric) => (
                    <div key={metric.label} className="metric-card rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <metric.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                          <span className="text-xs font-medium">{metric.label}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] ${metric.change >= 0 ? 'text-[hsl(var(--sentinel-healthy))]' : 'text-[hsl(var(--sentinel-critical))]'}`}>
                          {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(metric.change).toFixed(1)}%
                        </div>
                      </div>
                      <Progress value={metric.value} className="h-1.5" />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">Score</span>
                        <span className="text-[10px] font-medium font-mono tabular-nums text-[hsl(var(--primary))]">{metric.value.toFixed(0)}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mood Over Time Chart */}
          {activeTab === "overview" && (
            <div className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Team Mood Over Time
                </CardTitle>
                <CardDescription>30-day mood trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-48">
                  <div className="flex items-end justify-between h-32 gap-[2px]">
                    {moodOverTime.map((data, idx) => (
                      <div 
                        key={idx}
                        className="flex-1 rounded-sm transition-all hover:opacity-80 cursor-pointer group relative"
                        style={{ 
                          height: `${data.score}%`,
                          backgroundColor: data.score > 70 ? 'hsl(var(--sentinel-healthy))' : data.score > 40 ? 'hsl(var(--sentinel-elevated))' : 'hsl(var(--sentinel-critical))'
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border">
                          {data.date}: {data.score.toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>30 days ago</span>
                    <span>15 days ago</span>
                    <span>Today</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
                    <span className="text-[11px] text-muted-foreground">Positive</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--sentinel-elevated))]" />
                    <span className="text-[11px] text-muted-foreground">Neutral</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--sentinel-critical))]" />
                    <span className="text-[11px] text-muted-foreground">Negative</span>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
                    Collaboration Trends
                  </CardTitle>
                  <CardDescription>Track how your team works together</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {collaborationTrends.map((metric) => (
                      <div key={metric.label} className="metric-card rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                            <metric.icon className="h-5 w-5 text-[hsl(var(--primary))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{metric.label}</p>
                            <p className="text-[10px] text-muted-foreground">Last 30 days</p>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{metric.value.toFixed(0)}</p>
                            <p className="text-[10px] text-muted-foreground">Score</p>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                            metric.change >= 0 ? 'bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]' : 'bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]'
                          }`}>
                            {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(metric.change).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Trend Details */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Collaborators</CardTitle>
                    <CardDescription>Most active team connectors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { name: "Sarah Chen", collaborations: 156, avatar: "SC" },
                        { name: "Mike Johnson", collaborations: 142, avatar: "MJ" },
                        { name: "Emily Davis", collaborations: 128, avatar: "ED" },
                        { name: "Alex Kim", collaborations: 115, avatar: "AK" },
                        { name: "Jordan Lee", collaborations: 98, avatar: "JL" }
                      ].map((person, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white font-bold text-[10px] font-mono tabular-nums">
                            {idx + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px]">
                              {person.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{person.name}</p>
                          </div>
                          <span className="text-xs font-mono tabular-nums text-[hsl(var(--primary))]">{person.collaborations}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm">Team Bonding Events</CardTitle>
                    <CardDescription>Recent & upcoming activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { event: "Team Lunch", date: "Yesterday", type: "completed", icon: "🍕" },
                        { event: "Game Night", date: "This Friday", type: "upcoming", icon: "🎮" },
                        { event: "Team Retreat", date: "Next Month", type: "planning", icon: "🏖️" },
                        { event: "Coffee Chat", date: "Every Friday", type: "recurring", icon: "☕" },
                        { event: "Show & Tell", date: "Bi-weekly", type: "recurring", icon: "📊" }
                      ].map((event, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                          <span className="text-lg">{event.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.event}</p>
                            <p className="text-[10px] text-muted-foreground">{event.date}</p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={
                              event.type === "completed" ? "text-[9px] bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]" :
                              event.type === "upcoming" ? "text-[9px] bg-[hsl(var(--sentinel-info))]/10 text-[hsl(var(--sentinel-info))]" :
                              "text-[9px] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            }
                          >
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>
            </div>
          )}

          {/* Work-Life Balance Tab */}
          {activeTab === "balance" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Moon className="h-5 w-5 text-[hsl(var(--primary))]" />
                    Work-Life Balance Metrics
                  </CardTitle>
                  <CardDescription>Monitor team wellness and burnout indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {workLifeBalance.map((metric) => (
                      <div key={metric.label} className="text-center p-4 rounded-xl metric-card">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 mx-auto mb-3">
                          <metric.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                        </div>
                        <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{metric.value.toFixed(0)}</p>
                        <p className="text-[11px] text-muted-foreground mb-2">{metric.label}</p>
                        <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                          metric.label === "After-hours Activity" || metric.label === "Meeting Load"
                            ? (metric.change > 0 ? 'bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]' : 'bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]')
                            : (metric.change >= 0 ? 'bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))]' : 'bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]')
                        }`}>
                          {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(metric.change).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Balance Tips */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[hsl(var(--primary))]" />
                      Wellness Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { title: "Take Regular Breaks", desc: "Short breaks improve focus and reduce stress", icon: "☕" },
                        { title: "Set Clear Boundaries", desc: "Define work hours and stick to them", icon: "⏰" },
                        { title: "Use PTO Days", desc: "Taking time off prevents burnout", icon: "🏖️" },
                        { title: "Limit After-Hours", desc: "Avoid checking emails after work", icon: "🌙" },
                        { title: "Stay Active", desc: "Regular exercise boosts energy", icon: "🏃" }
                      ].map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                          <span className="text-lg">{tip.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{tip.title}</p>
                            <p className="text-[11px] text-muted-foreground">{tip.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                      Team Energy Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { time: "Morning (9AM-12PM)", energy: 85, label: "Peak Productivity" },
                        { time: "Afternoon (12PM-3PM)", energy: 70, label: "Post-Lunch Dip" },
                        { time: "Late Afternoon (3PM-6PM)", energy: 75, label: "Secondary Peak" },
                        { time: "Evening (6PM+)", energy: 25, label: "Wind Down" }
                      ].map((period, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{period.time}</span>
                            <span className="text-[10px] text-muted-foreground">{period.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[hsl(var(--primary))] rounded-full"
                                style={{ width: `${period.energy}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium font-mono tabular-nums text-[hsl(var(--primary))] w-8">{period.energy}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>

              {/* Work Hours Distribution */}
              <div className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm">Weekly Work Hours Distribution</CardTitle>
                  <CardDescription>How many hours team members are working</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { range: "< 35 hours", count: 3, color: "hsl(var(--sentinel-healthy))]" },
                      { range: "35-40 hours", count: 12, color: "hsl(var(--primary))" },
                      { range: "40-45 hours", count: 6, color: "hsl(var(--sentinel-elevated))" },
                      { range: "45-50 hours", count: 2, color: "hsl(var(--sentinel-critical))]" },
                      { range: "> 50 hours", count: 1, color: "hsl(var(--sentinel-critical))" }
                    ].map((group, idx) => {
                      const percentage = (group.count / 24) * 100
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="w-24 text-xs text-muted-foreground">{group.range}</span>
                          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%`, backgroundColor: group.color }}
                            >
                              <span className="text-[10px] text-white font-medium font-mono tabular-nums">{group.count}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              <span>Data refreshed every 5 minutes</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </main>
      </ScrollArea>
    </div>
  )
}

export default function CultureEnginePage() {
  return (
    <ProtectedRoute>
      <CultureContent />
    </ProtectedRoute>
  )
}
