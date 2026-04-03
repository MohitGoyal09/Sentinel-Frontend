'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
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
  Settings,
  Shield,
  Star,
  Store,
  Thermometer,
  Trash2,
  User,
  UserCog,
  Users,
  Workflow,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth-context'
import { useTenant } from '@/contexts/tenant-context'
import { useChatHistory } from '@/hooks/useChatHistory'
import { renameChatSession, deleteChatSession, toggleFavoriteSession } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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

  // Fix H1: Use window.prompt/confirm as simple fallback (dialog upgrade deferred)
  // Fix H3: Trim whitespace before sending
  // Fix H4: refetch in catch blocks for consistency
  const handleRename = async (sessionId: string, currentTitle: string) => {
    const rawTitle = window.prompt('Rename session:', currentTitle)
    if (rawTitle === null) return // cancelled
    const trimmed = rawTitle.trim()
    if (!trimmed || trimmed === currentTitle) return
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
    if (!window.confirm('Delete this conversation?')) return
    try {
      await deleteChatSession(sessionId)
      refetchHistory()
      toast.success('Session deleted')
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
                    <span className="font-semibold">Sentinel</span>
                    <span className="text-xs text-muted-foreground">Employee Insights</span>
                  </div>
                  <span className="ml-auto flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </Link>
              </SidebarMenuButton>
              <button
                onClick={toggleSidebar}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group-data-[collapsible=icon]:hidden shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
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
                                  <DropdownMenuItem onClick={() => handleRename(session.id, session.title)}>
                                    <Pencil className="h-3 w-3 mr-2" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleFavorite(session.id)}>
                                    <Star className="h-3 w-3 mr-2" /> {session.is_favorite ? 'Unfavorite' : 'Favorite'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDelete(session.id)} className="text-red-400">
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

              {/* Workflows */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(pathname, '/workflows')}
                  tooltip="Workflows"
                >
                  <Link href="/workflows">
                    <Workflow />
                    <span>Workflows</span>
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
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Admin — admin only, collapsible */}
              {isAdmin && (
                <Collapsible
                  asChild
                  defaultOpen={pathname.startsWith('/admin') || isActive(pathname, '/audit-log')}
                  className="group/admin"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={
                          pathname.startsWith('/admin') || isActive(pathname, '/audit-log')
                        }
                        tooltip="Admin"
                      >
                        <UserCog />
                        <span>Admin</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/admin:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/admin/users')}
                          >
                            <Link href="/admin/users">
                              <span>Users</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/admin/teams')}
                          >
                            <Link href="/admin/teams">
                              <span>Teams</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(pathname, '/audit-log')}
                          >
                            <Link href="/audit-log">
                              <span>Audit Logs</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ----------------------------------------------------------------- */}
      {/* Footer: tenant switcher, user menu                                 */}
      {/* ----------------------------------------------------------------- */}
      <SidebarFooter>
        {/* Tenant switcher */}
        {!authLoading && tenants.length > 1 ? (
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
        ) : !authLoading ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip={currentTenant?.name ?? 'Loading workspace…'}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border bg-background text-xs font-medium">
                  {currentTenant ? getInitials(currentTenant.name) : '…'}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium truncate">
                    {tenantLoading ? 'Loading…' : (currentTenant?.name ?? 'No workspace')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentTenant ? capitalize(currentTenant.plan ?? 'free') : ''}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

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
                    <DropdownMenuItem onClick={() => router.push('/account')}>
                      <User className="mr-2 size-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
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
    </Sidebar>
  )
}
