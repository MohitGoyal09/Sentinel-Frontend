'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { SettingsModal } from '@/components/settings-modal'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  Brain,
  ChevronLeft,
  ChevronsUpDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Pencil,
  PenSquare,
  Search,
  Settings,
  Shield,
  Star,
  Database,
  HeartPulse,
  Store,
  Thermometer,
  Trash2,
  Zap,
  User,
  UserCog,
  Users,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth-context'
import { useTenant } from '@/contexts/tenant-context'
import { useChatHistory } from '@/hooks/useChatHistory'
import { renameChatSession, deleteChatSession, toggleFavoriteSession } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'employee' | 'manager' | 'admin'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActive(pathname: string, url: string): boolean {
  if (url === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === url || pathname.startsWith(`${url}/`)
}

function capitalize(value?: string | null): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, userRole, loading: authLoading, signOut } = useAuth()
  const { currentTenant, tenants, loading: tenantLoading, switchTenant } = useTenant()
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()

  const { sessions: recentChats, isLoading: historyLoading, refetch: refetchHistory } = useChatHistory({ limit: 5 })

  // Only block rendering on auth loading — tenant can load in the background
  const isLoading = authLoading
  const role: Role = (userRole?.role ?? 'employee') as Role
  const roleResolved = !authLoading && userRole != null

  const isManager = roleResolved && (role === 'manager' || role === 'admin')
  const isAdmin = roleResolved && role === 'admin'

  const email = user?.email ?? ''
  const initials = getInitials(email.split('@')[0]?.replace(/[._-]/g, ' ') || '?')

  const openCommandPalette = useCallback(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', code: 'KeyK', ctrlKey: true, metaKey: true, bubbles: true,
    }))
  }, [])

  // ---- Settings modal state ----
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ---- Dialog state for rename / delete ----
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const openRenameDialog = useCallback((sessionId: string, currentTitle: string) => {
    setRenameTarget({ id: sessionId, title: currentTitle })
    setRenameValue(currentTitle)
  }, [])

  const handleRename = async (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed || trimmed === renameTarget?.title) return
    try {
      await renameChatSession(sessionId, trimmed)
      refetchHistory()
      toast.success('Session renamed')
    } catch {
      refetchHistory()
      toast.error('Failed to rename')
    }
  }

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId)
      refetchHistory()
      toast.success('Session deleted')
      // If the deleted session is currently active, navigate away
      if (pathname.includes(sessionId)) {
        router.push('/ask-sentinel')
      }
    } catch {
      refetchHistory()
      toast.error('Failed to delete')
    }
  }

  const handleToggleFavorite = async (sessionId: string) => {
    try {
      await toggleFavoriteSession(sessionId)
      refetchHistory()
    } catch {
      refetchHistory()
      toast.error('Failed to update')
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ----------------------------------------------------------------- */}
      {/* Header: App branding                                               */}
      {/* ----------------------------------------------------------------- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-1">
              <SidebarMenuButton size="lg" asChild tooltip="Sentinel" className="flex-1">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 text-white shadow-sm shadow-emerald-500/20">
                    <Shield className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{currentTenant?.name ?? 'Sentinel'}</span>
                    <span className="text-xs text-muted-foreground">{currentTenant ? capitalize(currentTenant.plan ?? 'free') : 'Employee Insights'}</span>
                  </div>
                  <span className="ml-auto flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </Link>
              </SidebarMenuButton>
              {/* Collapse toggle — visible when expanded */}
              <button
                onClick={toggleSidebar}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group-data-[collapsible=icon]:hidden shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            {/* Expand toggle — visible only when collapsed (icon mode) */}
            <button
              onClick={toggleSidebar}
              className="hidden group-data-[collapsible=icon]:flex h-8 w-8 mx-auto rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </SidebarMenuItem>
          {/* Search + New Chat row — KaraX pattern: search left, new chat icon right */}
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5">
              <button
                onClick={openCommandPalette}
                className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left text-xs">Search chats...</span>
                <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  Ctrl K
                </kbd>
              </button>
              <Link
                href="/ask-sentinel"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                title="New Chat"
              >
                <PenSquare className="h-3.5 w-3.5" />
              </Link>
            </div>
          </SidebarMenuItem>
          {/* New Chat — icon only, visible when collapsed */}
          <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
            <SidebarMenuButton asChild tooltip="New Chat" size="sm">
              <Link href="/ask-sentinel">
                <PenSquare className="h-4 w-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ----------------------------------------------------------------- */}
      {/* Content: Navigation                                                */}
      {/* ----------------------------------------------------------------- */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              {/* Ask Sentinel with History dropdown */}
              <Collapsible asChild defaultOpen={false} className="group/sentinel">
                <SidebarMenuItem>
                  <div className="flex items-center w-full">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, '/ask-sentinel')}
                      tooltip="Ask Sentinel"
                      className="flex-1"
                    >
                      <Link href="/ask-sentinel">
                        <MessageSquare />
                        <span>Ask Sentinel</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150 shrink-0 ml-1 group-data-[collapsible=icon]:hidden"
                        title="Recent conversations"
                      >
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/sentinel:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                    <Link
                      href="/ask-sentinel"
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group-data-[collapsible=icon]:hidden shrink-0"
                      title="New chat"
                    >
                      <PenSquare className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {historyLoading ? (
                        <SidebarMenuSubItem>
                          <span className="text-muted-foreground text-xs px-2 py-1">Loading...</span>
                        </SidebarMenuSubItem>
                      ) : recentChats.length === 0 ? (
                        <SidebarMenuSubItem>
                          <span className="text-muted-foreground text-xs px-2 py-1">No conversations yet</span>
                        </SidebarMenuSubItem>
                      ) : (
                        recentChats.map((session) => (
                          <SidebarMenuSubItem key={session.id} className="group/session">
                            <div className="flex items-center w-full">
                              <SidebarMenuSubButton asChild className="flex-1 min-w-0">
                                <Link href={`/ask-sentinel?session=${session.id}`}>
                                  {session.is_favorite && <Star className="h-3 w-3 text-amber-400 shrink-0" />}
                                  <span className="truncate text-xs">{session.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-5 w-5 rounded-sm flex items-center justify-center text-muted-foreground/0 group-hover/session:text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" side="right">
                                  <DropdownMenuItem onClick={() => openRenameDialog(session.id, session.title)}>
                                    <Pencil className="h-3 w-3 mr-2" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleFavorite(session.id)}>
                                    <Star className="h-3 w-3 mr-2" /> {session.is_favorite ? 'Unfavorite' : 'Favorite'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setDeleteTarget(session.id)} className="text-red-400">
                                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </SidebarMenuSubItem>
                        ))
                      )}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/ask-sentinel/history" className="text-muted-foreground/60 hover:text-foreground">
                            <span className="text-[10px]">View all history</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(pathname, '/dashboard')}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>


              {/* Marketplace — all roles */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(pathname, '/marketplace')}
                  tooltip="Marketplace"
                >
                  <Link href="/marketplace">
                    <Store />
                    <span>Marketplace</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Data Ingestion — manager + admin only */}
              {isManager && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, '/data-ingestion')}
                    tooltip="Data Ingestion"
                  >
                    <Link href="/data-ingestion">
                      <Database />
                      <span>Data Ingestion</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Team Health — manager + admin */}
              {isManager && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, '/team-health')}
                    tooltip="Team Health"
                  >
                    <Link href="/team-health">
                      <HeartPulse />
                      <span>Team Health</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Engines — manager + admin only, collapsible */}
              {isManager && (
                <Collapsible
                  asChild
                  defaultOpen={pathname.startsWith('/engines')}
                  className="group/engines"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.startsWith('/engines')}
                        tooltip="Engines"
                      >
                        <Activity />
                        <span>Engines</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/engines:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/engines/safety')}
                          >
                            <Link href="/engines/safety">
                              <Shield className="size-4" />
                              <span>Safety Valve</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/engines/talent')}
                          >
                            <Link href="/engines/talent">
                              <Users className="size-4" />
                              <span>Talent Scout</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/engines/culture')}
                          >
                            <Link href="/engines/culture">
                              <Thermometer className="size-4" />
                              <span>Culture Thermo</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/simulation')}
                          >
                            <Link href="/simulation">
                              <Zap className="size-4" />
                              <span>Simulation</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Methodology — all roles */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(pathname, '/methodology')}
                  tooltip="Methodology"
                >
                  <Link href="/methodology">
                    <Brain />
                    <span>Methodology</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Admin — admin only, single link */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin')}
                    tooltip="Admin"
                  >
                    <Link href="/admin">
                      <UserCog />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ----------------------------------------------------------------- */}
      {/* Footer: tenant switcher, user menu                                 */}
      {/* ----------------------------------------------------------------- */}
      <SidebarFooter>
        {/* Tenant switcher — only shown when user belongs to multiple tenants */}
        {!authLoading && tenants.length > 1 && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={currentTenant?.name ?? 'Switch tenant'}
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg border bg-background text-xs font-medium">
                      {getInitials(currentTenant?.name ?? '?')}
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium truncate">
                        {currentTenant?.name ?? 'No tenant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {capitalize(currentTenant?.plan ?? 'free')}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  align="start"
                  side="top"
                  sideOffset={4}
                >
                  <DropdownMenuLabel>Tenants</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tenants.map((tenant) => (
                    <DropdownMenuItem
                      key={tenant.id}
                      onClick={() => switchTenant(tenant.id)}
                      className="gap-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border text-xs">
                        {getInitials(tenant.name)}
                      </div>
                      <div className="flex flex-col">
                        <span>{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {capitalize(tenant.plan ?? 'free')}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarSeparator />

        {/* User menu */}
        {isLoading ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" tooltip={email || 'Account'}>
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium truncate">{email}</span>
                      <span className="text-xs text-muted-foreground">
                        {capitalize(role)}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  align="start"
                  side="top"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{email}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {capitalize(role)}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/me')}>
                      <User className="mr-2 size-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Settings className="mr-2 size-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center justify-between cursor-default"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex items-center gap-2">
                        <Moon className="size-4" />
                        Theme
                      </span>
                      <ThemeToggle />
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />

      {/* ----------------------------------------------------------------- */}
      {/* Delete confirmation dialog                                         */}
      {/* ----------------------------------------------------------------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget)
                }
                setDeleteTarget(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ----------------------------------------------------------------- */}
      {/* Rename dialog                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => { if (!open) setRenameTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameTarget) {
                handleRename(renameTarget.id, renameValue)
                setRenameTarget(null)
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (renameTarget) {
                  handleRename(renameTarget.id, renameValue)
                }
                setRenameTarget(null)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Settings modal                                                     */}
      {/* ----------------------------------------------------------------- */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}
