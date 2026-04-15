'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Info,
  Shield,
  Users,
  Activity,
  Settings,
  Search,
  ArrowUpRight,
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

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  auth: Shield, security: AlertTriangle, team: Users, system: Info, activity: Activity,
}

const PRIORITY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-[hsl(var(--sentinel-critical))]', bg: 'bg-[hsl(var(--sentinel-critical)/0.12)]', label: 'Critical' },
  high: { color: 'text-[hsl(var(--sentinel-elevated))]', bg: 'bg-[hsl(var(--sentinel-elevated)/0.12)]', label: 'High' },
  normal: { color: 'text-[hsl(var(--sentinel-healthy))]', bg: 'bg-[hsl(var(--sentinel-healthy)/0.12)]', label: 'AI Insight' },
}

function iconColorForType(type: string, priority: string): string {
  return PRIORITY_STYLES[priority]?.color ?? (type === 'activity' ? PRIORITY_STYLES.normal.color : 'text-muted-foreground')
}
function iconBgForType(type: string, priority: string): string {
  if (priority === 'critical') return 'bg-[hsl(var(--sentinel-critical)/0.1)]'
  if (priority === 'high') return 'bg-[hsl(var(--sentinel-elevated)/0.1)]'
  if (type === 'activity') return 'bg-[hsl(var(--sentinel-healthy)/0.1)]'
  return 'bg-white/5'
}

type FilterTab = 'all' | 'critical' | 'health' | 'insights' | 'system'

function matchesTab(n: Notification, tab: FilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'critical') return n.priority === 'critical'
  if (tab === 'health') return n.type === 'team' || n.type === 'activity'
  if (tab === 'insights') return n.type === 'activity' && n.priority === 'normal'
  if (tab === 'system') return n.type === 'system' || n.type === 'auth'
  return true
}

function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority]
  if (!style) return null
  return (
    <span className={`rounded-full ${style.bg} ${style.color} text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide leading-none`}>
      {style.label}
    </span>
  )
}

interface DateGroup { label: string; items: Notification[] }

function groupByDate(items: Notification[]): DateGroup[] {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const buckets: Record<string, Notification[]> = { today: [], yesterday: [], week: [], older: [] }
  for (const item of items) {
    const d = new Date(item.created_at)
    const ds = d.toDateString()
    if (ds === todayStr) buckets.today.push(item)
    else if (ds === yesterdayStr) buckets.yesterday.push(item)
    else if (d >= weekAgo) buckets.week.push(item)
    else buckets.older.push(item)
  }
  const labels: [string, string][] = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Earlier this week'], ['older', 'Older']]
  return labels.filter(([k]) => buckets[k].length > 0).map(([k, l]) => ({ label: l, items: buckets[k] }))
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        checked ? 'bg-primary' : 'bg-white/10',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        ].join(' ')}
      />
    </button>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  isProcessing,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  isProcessing: boolean
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Info
  const isUnread = !notification.read

  return (
    <div
      className={[
        'group relative flex items-center gap-3 py-4 px-5',
        isUnread ? 'bg-muted/20' : 'bg-transparent',
        notification.action_url ? 'cursor-pointer' : '',
        'transition-colors duration-150 hover:bg-muted/30',
      ].join(' ')}
      onClick={
        notification.action_url
          ? () => { window.location.href = notification.action_url! }
          : undefined
      }
    >
      {isUnread && <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />}
      <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconBgForType(notification.type, notification.priority)}`}>
        <Icon className={`h-4 w-4 ${iconColorForType(notification.type, notification.priority)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm leading-snug truncate ${isUnread ? 'font-medium text-foreground' : 'font-medium text-foreground/60'}`}>
            {notification.title}
          </h4>
          <PriorityBadge priority={notification.priority} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-1">{notification.message}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">{timeAgo(notification.created_at)}</span>
        {notification.action_url && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {isUnread && (
            <Button
              variant="ghost"
              size="icon"
              disabled={isProcessing}
              className="h-6 w-6 hover:bg-white/5 text-muted-foreground hover:text-foreground disabled:opacity-40"
              onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }}
              title="Mark as read"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            className="h-6 w-6 hover:bg-[hsl(var(--sentinel-critical)/0.1)] text-muted-foreground hover:text-[hsl(var(--sentinel-critical))] disabled:opacity-40"
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function DateHeader({ label, isFirst }: { label: string; isFirst: boolean }) {
  return (
    <div className={`py-3 px-5 ${isFirst ? '' : 'mt-2'}`}>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
    </div>
  )
}

function EmptyState({ searchQuery, activeTab }: { searchQuery: string; activeTab: FilterTab }) {
  if (searchQuery) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Search className="h-5 w-5 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
    </div>
  )
  if (activeTab !== 'all') return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-muted-foreground">No {activeTab} notifications.</p>
    </div>
  )
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Bell className="h-5 w-5 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-foreground/80">All clear</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs leading-relaxed">Notifications about wellness patterns, scheduled check-ins, and system updates will appear here.</p>
    </div>
  )
}

function PreferencesContent({
  preferences,
  onToggle,
  onSave,
  saving,
  quietHours,
  onToggleQuietHours,
}: {
  preferences: any[]
  onToggle: (index: number) => void
  onSave: () => void
  saving: boolean
  quietHours: boolean
  onToggleQuietHours: () => void
}) {
  const PREF_ROWS = [
    { label: 'Critical Alerts', description: 'Burnout risk alerts -- always on', locked: true, defaultEnabled: true },
    { label: 'AI Insights', description: 'Pattern detection and recommendations', locked: false, defaultEnabled: true },
    { label: 'Team Health Reports', description: 'Weekly and monthly summaries', locked: false, defaultEnabled: true },
    { label: 'Weekly Summaries', description: 'Digest of key metrics', locked: false, defaultEnabled: true },
    { label: 'System Updates', description: 'Platform and maintenance notices', locked: false, defaultEnabled: false },
  ]
  return (
    <>
      <div className="mt-6">
        {PREF_ROWS.map((pref, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-sm font-medium text-foreground">{pref.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{pref.description}</p>
            </div>
            <Toggle checked={pref.locked || (preferences[idx]?.enabled ?? pref.defaultEnabled)} onChange={() => !pref.locked && onToggle(idx)} disabled={pref.locked} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg px-4">
        <div className="flex items-center gap-2.5">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Quiet Hours</p>
            <p className="text-[11px] text-muted-foreground">9 pm -- 8 am, no alerts</p>
          </div>
        </div>
        <Toggle checked={quietHours} onChange={onToggleQuietHours} />
      </div>
      <div className="mt-6">
        <Button onClick={onSave} disabled={saving} className="w-full text-sm">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </>
  )
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'health', label: 'Health' },
  { key: 'insights', label: 'Insights' },
  { key: 'system', label: 'System' },
]

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [preferences, setPreferences] = useState<any[]>([])
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [quietHours, setQuietHours] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getNotifications(false, 100)
      setNotifications(data.notifications || [])
    } catch {
      // silent -- notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

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
    if (processingIds.has(id)) return
    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleMarkAllRead = async () => {
    if (processingIds.size > 0) return
    setProcessingIds(new Set(['__all__']))
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )
      await markAllRead()
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      fetchNotifications()
    } finally {
      setProcessingIds(new Set())
    }
  }

  const handleDelete = async (id: string) => {
    if (processingIds.has(id)) return
    setProcessingIds((prev) => new Set(prev).add(id))
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await deleteNotification(id)
    } catch (err) {
      console.error('Failed to delete notification:', err)
      fetchNotifications()
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const tabMatch = matchesTab(n, activeTab)
      const q = searchQuery.toLowerCase()
      const searchMatch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      return tabMatch && searchMatch
    })
  }, [notifications, activeTab, searchQuery])

  const counts: Record<FilterTab, number> = useMemo(() => ({
    all: notifications.length,
    critical: notifications.filter((n) => n.priority === 'critical').length,
    health: notifications.filter((n) => n.type === 'team' || n.type === 'activity').length,
    insights: notifications.filter((n) => n.type === 'activity' && n.priority === 'normal').length,
    system: notifications.filter((n) => n.type === 'system' || n.type === 'auth').length,
  }), [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const dateGroups = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications],
  )

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Wellness alerts and system updates</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs border border-white/[0.08] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold ml-0.5">{unreadCount}</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={openPreferences} className="h-8 w-8 border border-white/[0.08] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground" title="Preferences">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Sheet open={prefsOpen} onOpenChange={setPrefsOpen}>
        <SheetContent className="bg-card border-l border-white/[0.06] w-80">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">Notification Preferences</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">Choose which in-app notifications you receive.</SheetDescription>
          </SheetHeader>
          <PreferencesContent preferences={preferences} onToggle={handleTogglePref} onSave={handleSavePrefs} saving={prefsSaving} quietHours={quietHours} onToggleQuietHours={() => setQuietHours((q) => !q)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TABS.map(({ key, label }) => {
            const count = counts[key]
            const isActive = activeTab === key
            return (
              <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                {label}
                {count > 0 && <span className={`text-[10px] font-semibold rounded-full px-1.5 ${isActive ? 'bg-white/20 text-primary-foreground' : 'bg-white/[0.06] text-muted-foreground'}`}>{count}</span>}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all w-44" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState searchQuery={searchQuery} activeTab={activeTab} />
      ) : (
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-card overflow-hidden divide-y divide-border/30">
          {dateGroups.map((group, groupIdx) => (
            <div key={group.label} className={groupIdx > 0 ? 'border-t border-border/30' : ''}>
              <DateHeader label={group.label} isFirst={groupIdx === 0} />
              {group.items.map((n, nIdx) => (
                <div key={n.id} className={nIdx > 0 ? 'border-t border-border/30' : ''}>
                  <NotificationRow
                    notification={n}
                    onMarkRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    isProcessing={processingIds.has(n.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      </div>
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
