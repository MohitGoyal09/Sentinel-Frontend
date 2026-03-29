"use client"

import { useState, useEffect } from "react"
import {
  Shield, Lock, Eye, EyeOff, Database, ArrowRight,
  CheckCircle2, XCircle, Server, FileKey, Hash,
  RefreshCw, AlertTriangle, Users, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface HealthData {
  database?: { total_users: number; total_events: number; total_audit_logs: number }
  users?: { consent_rate: { consented: number; total: number; percentage: number } }
}

export default function PrivacyDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<HealthData>("/admin/health")
        setHealth(res as HealthData)
      } catch {
        // Use fallback demo data if API unavailable
        setHealth({
          database: { total_users: 13, total_events: 4280, total_audit_logs: 156 },
          users: { consent_rate: { consented: 10, total: 13, percentage: 77 } },
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const consentRate = health?.users?.consent_rate?.percentage || 0
  const totalUsers = health?.database?.total_users || 0
  const totalEvents = health?.database?.total_events || 0
  const totalAuditLogs = health?.database?.total_audit_logs || 0
  const consented = health?.users?.consent_rate?.consented || 0

  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-healthy))]/10">
                <Shield className="h-5 w-5" style={{color: 'hsl(var(--sentinel-healthy))'}} />
              </div>
              Privacy Architecture
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dual-vault system separating analytics from identity — privacy by design
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 border-[hsl(var(--sentinel-healthy))]/30" style={{color: 'hsl(var(--sentinel-healthy))'}}>
            <Lock className="h-3 w-3" />
            AES-256 + HMAC-SHA256
          </Badge>
        </div>

        {/* Privacy Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Data Subjects", value: totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Behavioral Events", value: totalEvents.toLocaleString(), icon: Activity, color: "text-[hsl(var(--sentinel-healthy))]", bg: "bg-[hsl(var(--sentinel-healthy))]/10" },
            { label: "Audit Entries", value: totalAuditLogs, icon: FileKey, color: "text-[hsl(var(--sentinel-elevated))]", bg: "bg-[hsl(var(--sentinel-elevated))]/10" },
            { label: "Consent Rate", value: `${consentRate}%`, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dual Vault Architecture Diagram */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Dual-Vault Architecture
            </CardTitle>
            <CardDescription>
              Data is separated at the database schema level — analytics never touches PII
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
              {/* Vault A */}
              <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Server className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-500">Vault A — Analytics</h3>
                    <p className="text-xs text-muted-foreground">Schema: analytics</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { table: "events", desc: "Behavioral data (commits, messages, reviews)", icon: Activity },
                    { table: "risk_scores", desc: "Current burnout risk per user_hash", icon: AlertTriangle },
                    { table: "risk_history", desc: "30-day risk trajectory snapshots", icon: Activity },
                    { table: "graph_edges", desc: "Social network connections (weighted)", icon: Users },
                    { table: "centrality_scores", desc: "Talent Scout betweenness metrics", icon: Activity },
                    { table: "skill_profiles", desc: "Radar chart skill assessments", icon: Activity },
                  ].map((t) => (
                    <div key={t.table} className="flex items-center gap-3 rounded-lg bg-background/50 px-3 py-2">
                      <Hash className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium">{t.table}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-medium text-blue-500">Identifier: user_hash (HMAC-SHA256)</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    No emails, names, or PII. One-way hash — cannot be reversed without the signing key.
                  </p>
                </div>
              </div>

              {/* Bridge */}
              <div className="flex flex-col items-center justify-center gap-3 py-8 lg:py-0">
                <div className="hidden lg:flex flex-col items-center gap-2">
                  <div className="h-16 w-px bg-border" />
                  <div className="p-2 rounded-full bg-primary/10 border border-primary/30">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-[10px] text-center text-muted-foreground max-w-[100px]">
                    Join only via<br />user_hash lookup
                  </div>
                  <div className="h-16 w-px bg-border" />
                </div>
                <div className="lg:hidden flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <div className="p-2 rounded-full bg-primary/10 border border-primary/30">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>

              {/* Vault B */}
              <div className="rounded-xl border-2 border-purple-500/30 bg-purple-500/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Lock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-500">Vault B — Identity</h3>
                    <p className="text-xs text-muted-foreground">Schema: identity</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { table: "user_identities", desc: "Encrypted email, role, consent flags" },
                    { table: "audit_logs", desc: "Immutable action trail (who did what)" },
                  ].map((t) => (
                    <div key={t.table} className="flex items-center gap-3 rounded-lg bg-background/50 px-3 py-2">
                      <FileKey className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium">{t.table}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-medium text-purple-500">Encryption: AES-256-CBC</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Emails stored as ciphertext. Decryption requires ENCRYPTION_KEY (env var, never in code).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Flow Pipeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Data Flow — From Ingestion to Insight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "Raw Event", desc: "Git / Slack / Jira", color: "border-slate-500/30 bg-slate-500/5", text: "text-muted-foreground/70" },
                null,
                { label: "HMAC Hash", desc: "email → user_hash", color: "border-[hsl(var(--sentinel-elevated))]/30 bg-[hsl(var(--sentinel-elevated))]/5", text: "text-[hsl(var(--sentinel-elevated))]" },
                null,
                { label: "Vault A Store", desc: "Analytics schema", color: "border-blue-500/30 bg-blue-500/5", text: "text-blue-500" },
                null,
                { label: "Engine Process", desc: "Safety / Talent / Culture", color: "border-[hsl(var(--sentinel-healthy))]/30 bg-[hsl(var(--sentinel-healthy))]/5", text: "text-[hsl(var(--sentinel-healthy))]" },
                null,
                { label: "Dashboard", desc: "Risk + insights", color: "border-purple-500/30 bg-purple-500/5", text: "text-purple-500" },
              ].map((step, i) =>
                step === null ? (
                  <ArrowRight key={`arrow-${i}`} className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                ) : (
                  <div
                    key={step.label}
                    className={cn(
                      "rounded-xl border-2 px-4 py-3 text-center min-w-[120px]",
                      step.color
                    )}
                  >
                    <p className={cn("text-sm font-semibold", step.text)}>{step.label}</p>
                    <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                  </div>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              PII is stripped at the HMAC hashing stage. All downstream processing uses anonymous hashes only.
            </p>
          </CardContent>
        </Card>

        {/* Consent & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Privacy Controls */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Employee Privacy Controls
              </CardTitle>
              <CardDescription>Rights available to every data subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Share with Manager",
                  desc: "Allow identified data to be visible to direct manager",
                  icon: Users,
                  status: `${consented} of ${totalUsers} opted in`,
                  active: true,
                },
                {
                  title: "Anonymous Aggregation",
                  desc: "Allow data in team-level aggregates (no individual identification)",
                  icon: Activity,
                  status: "Default: enabled",
                  active: true,
                },
                {
                  title: "Pause Monitoring",
                  desc: "Temporarily stop data collection (vacation, personal reasons)",
                  icon: EyeOff,
                  status: "Available on demand",
                  active: false,
                },
                {
                  title: "Right to Deletion",
                  desc: "Request complete erasure of all personal data (GDPR Art. 17)",
                  icon: XCircle,
                  status: "Cascades both vaults",
                  active: false,
                },
              ].map((control) => (
                <div key={control.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    control.active ? "bg-[hsl(var(--sentinel-healthy))]/10" : "bg-muted"
                  )}>
                    <control.icon className={cn("h-4 w-4", control.active ? "" : "text-muted-foreground")} style={control.active ? {color: 'hsl(var(--sentinel-healthy))'} : undefined} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{control.title}</p>
                      <Badge variant="outline" className="text-[10px]">{control.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{control.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Guarantees */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security Guarantees
              </CardTitle>
              <CardDescription>Technical safeguards enforced at every layer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Zero PII in Analytics",
                  desc: "Vault A contains only HMAC hashes — mathematically irreversible without the signing key",
                  check: true,
                },
                {
                  title: "Encryption at Rest",
                  desc: "Vault B emails encrypted with AES-256-CBC. Key stored in environment, never in code or DB",
                  check: true,
                },
                {
                  title: "Immutable Audit Trail",
                  desc: "Every data access, consent change, and admin action logged to Vault B with timestamp",
                  check: true,
                },
                {
                  title: "Role-Based Access (RBAC)",
                  desc: "Employees see only their data. Managers see team (with consent). Admins see aggregates",
                  check: true,
                },
                {
                  title: "Rate Limiting",
                  desc: "Token-bucket rate limiter on all API endpoints — prevents enumeration and brute force",
                  check: true,
                },
                {
                  title: "Security Headers",
                  desc: "X-Frame-Options, CSP, XSS protection, strict referrer policy on every response",
                  check: true,
                },
              ].map((guarantee) => (
                <div key={guarantee.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{color: 'hsl(var(--sentinel-healthy))'}} />
                  <div>
                    <p className="text-sm font-medium">{guarantee.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{guarantee.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
