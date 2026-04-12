'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Users,
  Activity,
  Settings,
  Sparkles,
  Search,
  Mail,
  Smartphone,
  Moon,
} from 'lucide-react'
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  Notification,
} from '@/lib/notifications'
import { timeAgo } from '@/lib/utils'

// ─── Type helpers ─────────────────────────────────────────────────────────────
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  auth: Shield,
  security: AlertTriangle,
  team: Users,
  system: Info,
  activity: Activity,
}

type FilterTab = 'all' | 'critical' | 'health' | 'insights' | 'system'

function matchesTab(n: Notification, tab: FilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'critical') return n.priority === 'critical'
  if (tab === 'health') return n.type === 'team' || n.type === 'activity'
  if (tab === 'insights') return (n as any).category === 'insight' || n.type === 'activity'
  if (tab === 'system') return n.type === 'system' || n.type === 'auth'
  return true
}

// ─── Badge chip ───────────────────────────────────────────────────────────────
function PriorityBadge({ priority, type }: { priority: string; type: string }) {
  if (priority === 'critical') {
    return (
      <span className="rounded-full bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
        Critical
      </span>
    )
  }
  if ((type as any) === 'insight' || priority === 'normal') {
    return (
      <span className="rounded-full bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
        AI Insight
      </span>
    )
  }
  return (
    <span className="rounded-full bg-white/5 text-muted-foreground text-[10px] font-medium px-2 py-0.5 capitalize">
      {type}
    </span>
  )
}

// ─── Left border color by priority ───────────────────────────────────────────
function borderAccentClass(priority: string): string {
  switch (priority) {
    case 'critical': return 'border-l-destructive'
    case 'high': return 'border-l-[hsl(var(--sentinel-elevated))]'
    case 'normal': return 'border-l-accent'
    default: return 'border-l-border'
  }
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const Icon =
    notification.priority === 'critical'
      ? AlertCircle
      : (notification as any).category === 'insight'
        ? Sparkles
        : typeIcons[notification.type] ?? Info

  const iconColor =
    notification.priority === 'critical'
      ? 'text-destructive'
      : (notification as any).category === 'insight'
        ? 'text-accent'
        : 'text-muted-foreground'

  const iconBg =
    notification.priority === 'critical'
      ? 'bg-destructive/10'
      : (notification as any).category === 'insight'
        ? 'bg-accent/10'
        : 'bg-white/5'

  const inner = (
    <div
      className={[
        'group relative flex items-start gap-3 rounded-xl bg-card border border-white/5 p-4',
        borderAccentClass(notification.priority),
        !notification.read ? '' : 'opacity-60',
        notification.action_url ? 'cursor-pointer hover:border-white/10 hover:bg-card/80' : '',
        'transition-[background-color,border-color,opacity] duration-150',
      ].join(' ')}
      onClick={
        notification.action_url
          ? () => { window.location.href = notification.action_url! }
          : undefined
      }
    >
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={notification.priority} type={notification.type} />
          {!notification.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
        <h4 className={`mt-1.5 text-sm leading-snug ${!notification.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
          {notification.title}
        </h4>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
          {timeAgo(notification.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-white/5 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }}
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )

  return <div className="mb-2">{inner}</div>
}

// ─── Date group separator ─────────────────────────────────────────────────────
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-5 mb-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
      />
    </button>
  )
}

// ─── Delivery mode segmented control ─────────────────────────────────────────
type DeliveryMode = 'email' | 'in-app' | 'both'

function DeliverySegment({
  value,
  onChange,
}: {
  value: DeliveryMode
  onChange: (v: DeliveryMode) => void
}) {
  const options: { key: DeliveryMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'in-app', label: 'In-App', icon: Smartphone },
    { key: 'both', label: 'Both', icon: Bell },
  ]
  return (
    <div className="flex rounded-lg bg-background border border-white/5 p-0.5 gap-0.5">
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={[
            'flex items-center gap-1.5 flex-1 justify-center text-xs rounded-md px-3 py-1.5 transition-all duration-150',
            value === key
              ? 'bg-card text-foreground font-medium border border-white/5 shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────
function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [preferences, setPreferences] = useState<any[]>([])
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('both')
  const [quietHours, setQuietHours] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getNotifications(activeTab === 'all' ? false : false, 100)
      setNotifications(data.notifications || [])
    } catch {
      // silent - notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const openPreferences = async () => {
    setPrefsOpen(true)
    try {
      const prefs = await getNotificationPreferences()
      setPreferences(Array.isArray(prefs) ? prefs : [])
    } catch {
      setPreferences([])
    }
  }

  const handleTogglePref = (index: number) => {
    setPreferences((prev) =>
      prev.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const handleSavePrefs = async () => {
    setPrefsSaving(true)
    try {
      await updateNotificationPreferences(preferences)
    } finally {
      setPrefsSaving(false)
      setPrefsOpen(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
    )
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const tabMatch = matchesTab(n, activeTab)
    const searchMatch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return tabMatch && searchMatch
  })

  // Tab counts
  const counts: Record<FilterTab, number> = {
    all: notifications.length,
    critical: notifications.filter((n) => n.priority === 'critical').length,
    health: notifications.filter((n) => n.type === 'team' || n.type === 'activity').length,
    insights: notifications.filter((n) => (n as any).category === 'insight' || n.type === 'activity').length,
    system: notifications.filter((n) => n.type === 'system' || n.type === 'auth').length,
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Group notifications by date
  const todayStr = new Date().toDateString()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toDateString()

  const todayItems = filteredNotifications.filter(
    (n) => new Date(n.created_at).toDateString() === todayStr
  )
  const yesterdayItems = filteredNotifications.filter(
    (n) => new Date(n.created_at).toDateString() === yesterdayStr
  )
  const olderItems = filteredNotifications.filter((n) => {
    const d = new Date(n.created_at).toDateString()
    return d !== todayStr && d !== yesterdayStr
  })

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'health', label: 'Health' },
    { key: 'insights', label: 'Insights' },
    { key: 'system', label: 'System' },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-background">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stay on top of critical alerts and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground gap-2"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                {unreadCount}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={openPreferences}
            className="text-xs border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground gap-2"
          >
            <Settings className="h-3.5 w-3.5" />
            Preferences
          </Button>
        </div>
      </div>

      {/* ── Preferences Sheet ────────────────────────────────────────────── */}
      <Sheet open={prefsOpen} onOpenChange={setPrefsOpen}>
        <SheetContent className="bg-card border-l border-white/10 w-80">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">Notification Preferences</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Choose which notifications you want to receive.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-1">
            {/* Static preference rows (shown while API prefs load) */}
            {[
              { label: 'Critical Alerts', description: 'Burnout risk alerts — always on', enabled: true, locked: true },
              { label: 'AI Insights', description: 'Pattern detection and recommendations', enabled: true },
              { label: 'Team Health Reports', description: 'Weekly and monthly summaries', enabled: true },
              { label: 'Weekly Summaries', description: 'Digest of key metrics', enabled: true },
              { label: 'System Updates', description: 'Platform and maintenance notices', enabled: false },
            ].map((pref, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  {pref.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{pref.description}</p>
                  )}
                </div>
                <Toggle
                  checked={pref.locked ? true : (preferences[idx]?.enabled ?? pref.enabled)}
                  onChange={() => !pref.locked && handleTogglePref(idx)}
                />
              </div>
            ))}
          </div>

          {/* Delivery mode */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Delivery Channel
            </p>
            <DeliverySegment value={deliveryMode} onChange={setDeliveryMode} />
          </div>

          {/* Quiet hours */}
          <div className="mt-5 flex items-center justify-between py-3 bg-card/60 border border-white/5 rounded-xl px-4">
            <div className="flex items-center gap-2.5">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Quiet Hours</p>
                <p className="text-[11px] text-muted-foreground">9pm – 8am, no alerts</p>
              </div>
            </div>
            <Toggle checked={quietHours} onChange={() => setQuietHours((q) => !q)} />
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSavePrefs}
              disabled={prefsSaving}
              className="w-full text-sm active:scale-[0.97] transition-transform"
            >
              {prefsSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {TABS.map(({ key, label }) => {
            const count = counts[key]
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={[
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,border-color] duration-150',
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-card border border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground',
                ].join(' ')}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold rounded-full px-1.5 ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-52"
          />
        </div>
      </div>

      {/* ── Notification Feed ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-card border border-white/5 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No notifications</h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : activeTab === 'all'
                ? 'You have no notifications yet.'
                : `No ${activeTab} notifications.`}
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">
          {todayItems.length > 0 && (
            <>
              <DateSeparator label="Today" />
              {todayItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
          {yesterdayItems.length > 0 && (
            <>
              <DateSeparator label="Yesterday" />
              {yesterdayItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
          {olderItems.length > 0 && (
            <>
              <DateSeparator label="Older" />
              {olderItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  )
}
