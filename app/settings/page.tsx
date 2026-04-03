"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Settings, User, Bell, Shield, Monitor, History, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

const STORAGE_PREFIX = "sentinel-settings-"

interface NotificationSettings {
  emailDigest: boolean
  riskAlerts: boolean
  teamUpdates: boolean
  productNews: boolean
}

interface TeamPreferences {
  anonymizeDefault: boolean
}

function readBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue
  const stored = localStorage.getItem(STORAGE_PREFIX + key)
  if (stored === null) return defaultValue
  return stored === "true"
}

function writeBoolean(key: string, value: boolean): void {
  localStorage.setItem(STORAGE_PREFIX + key, String(value))
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "admin":
      return "default"
    case "manager":
      return "secondary"
    default:
      return "outline"
  }
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const router = useRouter()
  const { user, userRole } = useAuth()

  const role = userRole?.role ?? "employee"
  const email = user?.email ?? ""
  const isManagerOrAdmin = role === "manager" || role === "admin"
  const isEmployee = role === "employee"

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailDigest: true,
    riskAlerts: true,
    teamUpdates: false,
    productNews: false,
  })

  const [teamPrefs, setTeamPrefs] = useState<TeamPreferences>({
    anonymizeDefault: true,
  })

  const [mounted, setMounted] = useState(false)

  // SSR-safe localStorage init
  useEffect(() => {
    setNotifications({
      emailDigest: readBoolean("notifications-email-digest", true),
      riskAlerts: readBoolean("notifications-risk-alerts", true),
      teamUpdates: readBoolean("notifications-team-updates", false),
      productNews: readBoolean("notifications-product-news", false),
    })
    setTeamPrefs({
      anonymizeDefault: readBoolean("anonymize-default", true),
    })
    setMounted(true)
  }, [])

  function updateNotification(key: keyof NotificationSettings, value: boolean) {
    const storageKeyMap: Record<keyof NotificationSettings, string> = {
      emailDigest: "notifications-email-digest",
      riskAlerts: "notifications-risk-alerts",
      teamUpdates: "notifications-team-updates",
      productNews: "notifications-product-news",
    }
    writeBoolean(storageKeyMap[key], value)
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  function updateTeamPref(key: keyof TeamPreferences, value: boolean) {
    const storageKeyMap: Record<keyof TeamPreferences, string> = {
      anonymizeDefault: "anonymize-default",
    }
    writeBoolean(storageKeyMap[key], value)
    setTeamPrefs((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              <Settings className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h1 className="text-sm font-semibold text-foreground">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <p className="text-sm text-foreground font-mono">{email || "—"}</p>
              </div>
              <Badge variant={getRoleBadgeVariant(role)} className="capitalize text-xs">
                {role}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Privacy
                </Label>
                <p className="text-xs text-muted-foreground">
                  Manage your consent and data sharing preferences
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/privacy")}
                className="text-xs gap-1.5"
              >
                <ExternalLink className="h-3 w-3" />
                Privacy Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>Choose which notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest" className="text-sm font-medium">
                  Email Digest
                </Label>
                <p className="text-xs text-muted-foreground">
                  Weekly summary of your wellbeing insights
                </p>
              </div>
              {mounted && (
                <Switch
                  id="email-digest"
                  checked={notifications.emailDigest}
                  onCheckedChange={(v) => updateNotification("emailDigest", v)}
                />
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="risk-alerts" className="text-sm font-medium">
                  Risk Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notifications when your risk level changes
                </p>
              </div>
              {mounted && (
                <Switch
                  id="risk-alerts"
                  checked={notifications.riskAlerts}
                  onCheckedChange={(v) => updateNotification("riskAlerts", v)}
                />
              )}
            </div>

            {isManagerOrAdmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="team-updates" className="text-sm font-medium">
                      Team Updates
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Alerts when team members' risk levels change significantly
                    </p>
                  </div>
                  {mounted && (
                    <Switch
                      id="team-updates"
                      checked={notifications.teamUpdates}
                      onCheckedChange={(v) => updateNotification("teamUpdates", v)}
                    />
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="product-news" className="text-sm font-medium">
                  Product News
                </Label>
                <p className="text-xs text-muted-foreground">
                  Updates about new Sentinel features and improvements
                </p>
              </div>
              {mounted && (
                <Switch
                  id="product-news"
                  checked={notifications.productNews}
                  onCheckedChange={(v) => updateNotification("productNews", v)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Preferences — manager and admin only */}
        {isManagerOrAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Team Preferences
              </CardTitle>
              <CardDescription>Default settings when viewing team data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymize-default" className="text-sm font-medium">
                    Default Anonymization
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show anonymized names when viewing team member insights by default
                  </p>
                </div>
                {mounted && (
                  <Switch
                    id="anonymize-default"
                    checked={teamPrefs.anonymizeDefault}
                    onCheckedChange={(v) => updateTeamPref("anonymizeDefault", v)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              Appearance
            </CardTitle>
            <CardDescription>Visual and display preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Dark mode follows your system preferences
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                System
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail — employee only */}
        {isEmployee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-muted-foreground" />
                My Audit Trail
              </CardTitle>
              <CardDescription>
                A record of actions taken on your account and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <History className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-sm">No audit entries found.</p>
                <p className="text-xs mt-1 opacity-70">
                  Access events will appear here when managers or admins view your data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}
