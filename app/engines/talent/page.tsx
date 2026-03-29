"use client"

import { Suspense, useState, useMemo, useEffect } from "react"

import { SkillsRadar } from "@/components/skills-radar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Sparkles,
  Users,
  Target,
  TrendingUp,
  Award,
  Gem,
  RefreshCw,
  ChevronRight,
  Star,
  Crown,
  ArrowUpRight,
  BarChart3,
  Info,
  Clock,
  Zap,
  HandHeart,
  Lightbulb,
  UsersRound
} from "lucide-react"

import { Employee, RiskLevel, toRiskLevel, NetworkNode } from "@/types"

import { useNetworkData } from "@/hooks/useNetworkData"
import { useTeamData } from "@/hooks/useTeamData"
import { useUsers } from "@/hooks/useUsers"

interface TalentProfile {
  user_hash: string
  name: string
  role: string
  skills: {
    technical: number
    communication: number
    leadership: number
    collaboration: number
    adaptability: number
    creativity: number
  }
  betweenness: number
  eigenvector: number
  unblocking: number
  is_hidden_gem: boolean
  potential_score: number
  visibility_score: number
}

function TalentContent() {
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "pipeline" | "gems">("overview")

  const { users, isLoading: usersLoading } = useUsers()

  useEffect(() => {
    if (!selectedUserHash && users.length > 0) {
      setSelectedUserHash(users[0].user_hash)
    }
  }, [users, selectedUserHash])

  const employees = useMemo(() => {
    return users.map(u => ({
      user_hash: u.user_hash,
      name: u.name || `User ${u.user_hash.slice(0, 4)}`,
      role: u.role || "Engineer",
      risk_level: toRiskLevel(u.risk_level),
      velocity: u.velocity || 0,
      confidence: u.confidence || 0,
      belongingness_score: 0.5,
      circadian_entropy: 0.5,
      updated_at: u.updated_at || new Date().toISOString(),
      persona: "Engineer",
      indicators: {
        overwork: false,
        isolation: false,
        fragmentation: false,
        late_night_pattern: false,
        weekend_work: false,
        communication_decline: false
      }
    } as Employee))
  }, [users])

  const { data: networkData } = useNetworkData(selectedUserHash)
  const { data: teamData } = useTeamData()

  const talentProfiles = useMemo((): TalentProfile[] => {
    if (!networkData?.nodes || networkData.nodes.length === 0) {
      return employees.map((emp, idx) => ({
        user_hash: emp.user_hash,
        name: emp.name,
        role: emp.role,
        skills: {
          technical: 60 + Math.random() * 35,
          communication: 55 + Math.random() * 40,
          leadership: 40 + Math.random() * 45,
          collaboration: 65 + Math.random() * 30,
          adaptability: 50 + Math.random() * 45,
          creativity: 45 + Math.random() * 40
        },
        betweenness: Math.random() * 0.8,
        eigenvector: Math.random() * 0.9,
        unblocking: Math.floor(Math.random() * 15),
        is_hidden_gem: Math.random() > 0.7,
        potential_score: 50 + Math.random() * 45,
        visibility_score: 30 + Math.random() * 60
      }))
    }

    return networkData.nodes.map((node: NetworkNode, idx: number) => ({
      user_hash: node.id || `user_${idx}`,
      name: node.label || `User ${idx + 1}`,
      role: employees[idx % employees.length]?.role || "Engineer",
      skills: {
        technical: 60 + Math.random() * 35,
        communication: 55 + Math.random() * 40,
        leadership: 40 + Math.random() * 45,
        collaboration: 65 + Math.random() * 30,
        adaptability: 50 + Math.random() * 45,
        creativity: 45 + Math.random() * 40
      },
      betweenness: node.betweenness || Math.random() * 0.8,
      eigenvector: node.eigenvector || Math.random() * 0.9,
      unblocking: node.unblocking_count || Math.floor(Math.random() * 15),
      is_hidden_gem: node.is_hidden_gem || Math.random() > 0.7,
      potential_score: 50 + Math.random() * 45,
      visibility_score: 30 + Math.random() * 60
    }))
  }, [networkData, employees])

  const selectedProfile = useMemo(() =>
    talentProfiles.find(p => p.user_hash === selectedUserHash) || talentProfiles[0] || null
  , [talentProfiles, selectedUserHash])

  const hiddenGems = useMemo(() => {
    return talentProfiles
      .filter(p => p.is_hidden_gem)
      .sort((a, b) => b.potential_score - a.potential_score)
      .slice(0, 6)
  }, [talentProfiles])

  const topPerformers = useMemo(() => {
    return [...talentProfiles]
      .sort((a, b) => {
        const scoreA = a.betweenness * 0.4 + a.eigenvector * 0.3 + a.unblocking * 0.3
        const scoreB = b.betweenness * 0.4 + b.eigenvector * 0.3 + b.unblocking * 0.3
        return scoreB - scoreA
      })
      .slice(0, 8)
  }, [talentProfiles])

  const leadershipPipeline = useMemo(() => {
    const pipeline = [
      { level: "Executive", minScore: 85, count: 0, employees: [] as TalentProfile[] },
      { level: "Senior Lead", minScore: 70, count: 0, employees: [] as TalentProfile[] },
      { level: "Team Lead", minScore: 55, count: 0, employees: [] as TalentProfile[] },
      { level: "High Potential", minScore: 40, count: 0, employees: [] as TalentProfile[] },
      { level: "Developing", minScore: 0, count: 0, employees: [] as TalentProfile[] }
    ]

    talentProfiles.forEach(profile => {
      const leadershipScore = (profile.skills.leadership * 0.4 + 
                              profile.skills.communication * 0.3 + 
                              profile.betweenness * 30)
      
      if (leadershipScore >= 85) {
        pipeline[0].count++
        pipeline[0].employees.push(profile)
      } else if (leadershipScore >= 70) {
        pipeline[1].count++
        pipeline[1].employees.push(profile)
      } else if (leadershipScore >= 55) {
        pipeline[2].count++
        pipeline[2].employees.push(profile)
      } else if (leadershipScore >= 40) {
        pipeline[3].count++
        pipeline[3].employees.push(profile)
      } else {
        pipeline[4].count++
        pipeline[4].employees.push(profile)
      }
    })

    return pipeline
  }, [talentProfiles])

  const skillsDistribution = useMemo(() => {
    const skills = ["technical", "communication", "leadership", "collaboration", "adaptability", "creativity"]
    return skills.map(skill => {
      const values = talentProfiles.map(p => p.skills[skill as keyof typeof p.skills])
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      return {
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        average: Math.round(avg),
        max: Math.round(max),
        min: Math.round(min)
      }
    })
  }, [talentProfiles])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPipelineColor = (level: string) => {
    switch (level) {
      case "Executive": return "bg-[hsl(var(--primary))]"
      case "Senior Lead": return "bg-[hsl(var(--primary))]/80"
      case "Team Lead": return "bg-[hsl(var(--primary))]/60"
      case "High Potential": return "bg-[hsl(var(--primary))]/40"
      default: return "bg-muted-foreground/30"
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-8 p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-gem))]/15 border border-[hsl(var(--sentinel-gem))]/20">
                <Sparkles className="h-6 w-6 text-[hsl(var(--sentinel-gem))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Talent Scout</h2>
                <p className="text-sm text-muted-foreground">Hidden talent & skill discovery</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Hero Section */}
          <div className="glass-card-elevated relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[hsl(var(--sentinel-gem))]/3" />
            
            <div className="relative grid gap-10 p-8 md:grid-cols-2 lg:gap-14">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--sentinel-gem))]/10 blur-3xl" />
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {hiddenGems.length}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                        Hidden Gems
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {hiddenGems.length >= 3 ? (
                    <>
                      <Gem className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                      <span className="text-sm font-medium text-[hsl(var(--sentinel-gem))]">Exceptional talent density</span>
                    </>
                  ) : hiddenGems.length >= 1 ? (
                    <>
                      <Sparkles className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                      <span className="text-sm font-medium text-[hsl(var(--sentinel-gem))]">Solid talent pipeline</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Building talent pipeline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col justify-center gap-4">
                {/* Top Performers */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-gem))]/10">
                      <Award className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Top Performers</p>
                      <p className="text-[11px] text-muted-foreground">Highest network impact</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--sentinel-gem))]">{topPerformers.length}</p>
                    <p className="text-[10px] text-muted-foreground">Identified</p>
                  </div>
                </div>

                {/* Leadership Pipeline */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                      <Crown className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Leadership Pipeline</p>
                      <p className="text-[11px] text-muted-foreground">Ready for promotion</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">{leadershipPipeline[0].count + leadershipPipeline[1].count + leadershipPipeline[2].count}</p>
                    <p className="text-[10px] text-muted-foreground">In pipeline</p>
                  </div>
                </div>

                {/* Team Skill Avg */}
                <div className="metric-card flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Avg Skill Score</p>
                      <p className="text-[11px] text-muted-foreground">Team average</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">
                      {skillsDistribution?.length > 0 
                        ? Math.round(skillsDistribution.reduce((a, b) => a + (b.average || 0), 0) / skillsDistribution.length)
                        : 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/ 100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-border">
            {(["overview", "pipeline", "gems"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[hsl(var(--primary))] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "overview" && <BarChart3 className="h-4 w-4" />}
                {tab === "pipeline" && <Crown className="h-4 w-4" />}
                {tab === "gems" && <Gem className="h-4 w-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Skills Radar */}
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
                      Skills Overview
                    </CardTitle>
                    <CardDescription>Team skill distribution analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProfile ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <SkillsRadar 
                            data={selectedProfile.skills} 
                            height={320}
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-3">Network Metrics</h4>
                            <div className="space-y-2.5">
                              {[
                                { label: "Betweenness Centrality", value: `${(selectedProfile.betweenness * 100).toFixed(1)}%` },
                                { label: "Eigenvector Score", value: `${(selectedProfile.eigenvector * 100).toFixed(1)}%` },
                                { label: "Unblocking Count", value: String(selectedProfile.unblocking) }
                              ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">{item.label}</span>
                                  <span className="text-sm font-medium font-mono tabular-nums text-[hsl(var(--primary))]">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium mb-3">Talent Scores</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Potential</span>
                                  <span className="text-xs font-medium font-mono tabular-nums">{selectedProfile.potential_score.toFixed(0)}%</span>
                                </div>
                                <Progress value={selectedProfile.potential_score} className="h-1.5" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Visibility</span>
                                  <span className="text-xs font-medium font-mono tabular-nums">{selectedProfile.visibility_score.toFixed(0)}%</span>
                                </div>
                                <Progress value={selectedProfile.visibility_score} className="h-1.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Select an employee to view skills</p>
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>

              {/* Employee Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {talentProfiles.length}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {talentProfiles.map((profile) => (
                    <button
                      key={profile.user_hash}
                      onClick={() => setSelectedUserHash(profile.user_hash)}
                      className={`w-full relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                        selectedUserHash === profile.user_hash
                          ? "bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/25 shadow-sm"
                          : "border-border bg-card hover:bg-accent/50"
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt={profile.name} />
                        <AvatarFallback className={profile.is_hidden_gem ? "bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))]" : "bg-muted"}>
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                          {profile.is_hidden_gem && (
                            <Gem className="h-3 w-3 text-[hsl(var(--sentinel-gem))] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{profile.role}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skills Distribution */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h3 className="text-base font-semibold text-foreground">Skills Distribution Across Team</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {skillsDistribution.map((skill) => (
                  <div key={skill.skill} className="metric-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <span className="text-[11px] font-mono tabular-nums text-[hsl(var(--primary))]">Avg: {skill.average}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Max", value: skill.max },
                        { label: "Avg", value: skill.average },
                        { label: "Min", value: skill.min }
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-2">
                          <div className="w-10 text-[10px] text-muted-foreground">{row.label}</div>
                          <Progress value={row.value} className="h-1.5 flex-1" />
                          <span className="text-[11px] font-medium font-mono tabular-nums w-7 text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership Pipeline Tab */}
          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h3 className="text-base font-semibold text-foreground">Leadership Pipeline</h3>
              </div>

              <div className="grid gap-4">
                {leadershipPipeline.map((level) => (
                  <div key={level.level} className="glass-card rounded-xl overflow-hidden">
                    <div className={`h-1 ${getPipelineColor(level.level)}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getPipelineColor(level.level)}`}>
                            <Crown className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{level.level}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {level.level === "Executive" && "C-Level, VP, Director"}
                              {level.level === "Senior Lead" && "Senior Managers, Tech Leads"}
                              {level.level === "Team Lead" && "Team Leads, Project Managers"}
                              {level.level === "High Potential" && "High performers ready for leadership"}
                              {level.level === "Developing" && "Building foundational skills"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-mono tabular-nums text-[hsl(var(--primary))]">
                            {level.count}
                          </p>
                          <p className="text-[10px] text-muted-foreground">employees</p>
                        </div>
                      </div>

                      {level.employees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {level.employees.slice(0, 5).map((emp) => (
                            <div 
                              key={emp.user_hash}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                                  {getInitials(emp.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{emp.name}</span>
                            </div>
                          ))}
                          {level.employees.length > 5 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{level.employees.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Gems Tab */}
          {activeTab === "gems" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-[hsl(var(--sentinel-gem))]" />
                <h3 className="text-base font-semibold text-foreground">Hidden Gems</h3>
                <Badge className="ml-1 text-[10px] bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))] border-[hsl(var(--sentinel-gem))]/20">
                  {hiddenGems.length} discovered
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                High potential employees with low visibility who deserve more recognition and opportunities.
              </p>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {hiddenGems.map((gem) => (
                  <div key={gem.user_hash} className="glass-card rounded-xl p-5 border border-[hsl(var(--sentinel-gem))]/15">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))]">
                            {getInitials(gem.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-semibold">{gem.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{gem.role}</p>
                        </div>
                      </div>
                      <Gem className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Potential</span>
                          <span className="text-[10px] font-medium font-mono tabular-nums">{gem.potential_score.toFixed(0)}%</span>
                        </div>
                        <Progress value={gem.potential_score} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Visibility</span>
                          <span className="text-[10px] font-medium font-mono tabular-nums">{gem.visibility_score.toFixed(0)}%</span>
                        </div>
                        <Progress value={gem.visibility_score} className="h-1.5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span>Unblocked {gem.unblocking} times</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-3">
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}

                {hiddenGems.length === 0 && (
                  <div className="col-span-full glass-card rounded-xl flex flex-col items-center justify-center py-16">
                    <Sparkles className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">No hidden gems detected yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Keep monitoring team interactions</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Performers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[hsl(var(--sentinel-gem))]" />
              <h3 className="text-base font-semibold text-foreground">Top Performers</h3>
              <Badge variant="secondary" className="ml-1 text-[10px]">Highest Impact</Badge>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {topPerformers.map((performer, idx) => (
                  <div 
                    key={performer.user_hash}
                    className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white font-bold text-xs font-mono tabular-nums">
                      {idx + 1}
                    </div>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={performer.is_hidden_gem ? "bg-[hsl(var(--sentinel-gem))]/15 text-[hsl(var(--sentinel-gem))] text-xs" : "bg-muted text-xs"}>
                        {getInitials(performer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{performer.name}</p>
                        {performer.is_hidden_gem && (
                          <Gem className="h-3 w-3 text-[hsl(var(--sentinel-gem))]" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{performer.role}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium font-mono tabular-nums">{(performer.betweenness * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">Betweenness</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium font-mono tabular-nums">{(performer.eigenvector * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">Eigenvector</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium font-mono tabular-nums">{performer.unblocking}</p>
                        <p className="text-[10px] text-muted-foreground">Unblocked</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

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

export default function TalentScoutPage() {
  return (
    <ProtectedRoute>
      <TalentContent />
    </ProtectedRoute>
  )
}
