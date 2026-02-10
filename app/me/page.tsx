"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Activity, 
  Shield, 
  User, 
  Clock, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  History,
  LogOut
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

// API client
import { api } from "@/lib/api"

interface UserProfile {
  user_hash: string
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused_until: string | null
  created_at: string
}

interface RiskData {
  velocity: number | null
  risk_level: string
  confidence: number
  thwarted_belongingness: number | null
  updated_at: string | null
}

interface MonitoringStatus {
  is_paused: boolean
  paused_until: string | null
}

interface AuditEntry {
  action: string
  timestamp: string
  details: any
}

interface MeData {
  user: UserProfile
  risk: RiskData | null
  audit_trail: AuditEntry[]
  monitoring_status: MonitoringStatus
}

function MePageContent() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [data, setData] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Fetch user data
  useEffect(() => {
    fetchMeData()
  }, [])

  const fetchMeData = async () => {
    try {
      setLoading(true)
      const response = await api.get("/me")
      setData(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load your data")
    } finally {
      setLoading(false)
    }
  }

  // Update consent settings
  const updateConsent = async (type: "manager" | "anonymized", value: boolean) => {
    try {
      setUpdating(true)
      const payload = type === "manager" 
        ? { consent_share_with_manager: value }
        : { consent_share_anonymized: value }
      
      await api.put("/me/consent", payload)
      await fetchMeData() // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update consent")
    } finally {
      setUpdating(false)
    }
  }

  // Pause monitoring
  const pauseMonitoring = async (hours: number) => {
    try {
      setUpdating(true)
      await api.post(`/me/pause-monitoring?hours=${hours}`)
      await fetchMeData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to pause monitoring")
    } finally {
      setUpdating(false)
    }
  }

  // Resume monitoring
  const resumeMonitoring = async () => {
    try {
      setUpdating(true)
      await api.post("/me/resume-monitoring")
      await fetchMeData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resume monitoring")
    } finally {
      setUpdating(false)
    }
  }

  // Delete all data
  const deleteAllData = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm")
      return
    }

    try {
      setUpdating(true)
      await api.delete("/me/data?confirm=true")
      // Sign out after deletion
      await signOut()
      router.push("/login")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete data")
      setUpdating(false)
    }
  }

  // Get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "text-red-600 bg-red-50 border-red-200"
      case "ELEVATED": return "text-amber-600 bg-amber-50 border-amber-200"
      case "LOW": return "text-green-600 bg-green-50 border-green-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  // Get risk icon
  const getRiskIcon = (level: string) => {
    switch (level) {
      case "CRITICAL": return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "ELEVATED": return <Activity className="h-5 w-5 text-amber-600" />
      case "LOW": return <CheckCircle2 className="h-5 w-5 text-green-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load data"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">My Wellbeing</h1>
              <p className="text-xs text-muted-foreground">User ID: {data.user.user_hash.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {data.user.role}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Risk Score Card */}
          <Card className={data.risk ? getRiskColor(data.risk.risk_level) : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {data.risk ? getRiskIcon(data.risk.risk_level) : <Activity className="h-5 w-5" />}
                Current Risk Level
              </CardTitle>
              <CardDescription className="text-inherit opacity-80">
                Based on your work patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.risk?.risk_level || "CALIBRATING"}
              </div>
              {data.risk && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Velocity:</span>
                    <span className="font-mono font-semibold">{data.risk.velocity?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-mono">{(data.risk.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Belongingness:</span>
                    <span className="font-mono">{data.risk.thwarted_belongingness?.toFixed(2) || "N/A"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Controls Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Privacy Controls
              </CardTitle>
              <CardDescription>Manage who can see your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Share with Manager */}
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="share-manager" className="text-sm font-medium">
                    Share with Manager
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow your manager to see your detailed metrics
                  </p>
                </div>
                <Switch
                  id="share-manager"
                  checked={data.user.consent_share_with_manager}
                  onCheckedChange={(checked) => updateConsent("manager", checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              {/* Share Anonymized */}
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="share-anon" className="text-sm font-medium">
                    Include in Team Analytics
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anonymized data in team metrics
                  </p>
                </div>
                <Switch
                  id="share-anon"
                  checked={data.user.consent_share_anonymized}
                  onCheckedChange={(checked) => updateConsent("anonymized", checked)}
                  disabled={updating}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <EyeOff className="h-4 w-4 shrink-0" />
                <p>
                  Your privacy is our priority. No data is shared without your explicit consent.
                </p>
              </div>
            </CardFooter>
          </Card>

          {/* Monitoring Controls Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Monitoring
              </CardTitle>
              <CardDescription>Control when you're being monitored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.monitoring_status.is_paused ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Monitoring Paused</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Monitoring will resume at{" "}
                    {data.monitoring_status.paused_until && 
                      new Date(data.monitoring_status.paused_until).toLocaleString()}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-lg border bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Monitoring Active</span>
                  </div>
                  <p className="mt-1 text-xs text-green-700">
                    Your work patterns are being analyzed for wellbeing insights
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Pause</p>
                <div className="flex gap-2">
                  {[8, 24, 72].map((hours) => (
                    <Button
                      key={hours}
                      variant="outline"
                      size="sm"
                      onClick={() => pauseMonitoring(hours)}
                      disabled={updating || data.monitoring_status.is_paused}
                      className="flex-1"
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>

              {data.monitoring_status.is_paused && (
                <Button 
                  onClick={resumeMonitoring} 
                  disabled={updating}
                  className="w-full"
                >
                  Resume Monitoring Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Data Access History
              </CardTitle>
              <CardDescription>See who accessed your data</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {data.audit_trail.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data access recorded in the last 30 days</p>
                  ) : (
                    data.audit_trail.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="mt-0.5">
                          {entry.action.includes("data_access") ? (
                            <Eye className="h-4 w-4 text-blue-500" />
                          ) : entry.action.includes("consent") ? (
                            <Shield className="h-4 w-4 text-green-500" />
                          ) : (
                            <Activity className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {entry.action.replace("data_access:", "").replace("_", " ").toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          {entry.details && (
                            <p className="text-xs text-muted-foreground">
                              {JSON.stringify(entry.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete My Data
              </CardTitle>
              <CardDescription className="text-red-600/80">
                Permanently delete all your personal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action is irreversible. All your data will be permanently deleted.
                </AlertDescription>
              </Alert>

              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete All My Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and all associated data. 
                      Type DELETE to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={deleteAllData}
                      disabled={updating || deleteConfirmText !== "DELETE"}
                    >
                      {updating ? "Deleting..." : "Delete Permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function MePage() {
  return (
    <ProtectedRoute>
      <MePageContent />
    </ProtectedRoute>
  )
}
