"use client"

import {
  Activity,
  GitBranch,
  LayoutDashboard,
  Network,
  Shield,
  Sparkles,
  Thermometer,
  Zap,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Settings,
  Play,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface AppSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

// Navigation items for each role - with href links for routing
const roleBasedNavItems: Record<string, Array<{ id: string; label: string; icon: any; href?: string }>> = {
  employee: [
    { id: "profile", label: "My Wellbeing", icon: User, href: "/profile" },
    { id: "dashboard", label: "Team Overview", icon: LayoutDashboard, href: "/dashboard" },
  ],
  manager: [
    { id: "profile", label: "My Wellbeing", icon: User, href: "/profile" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
  admin: [
    { id: "profile", label: "My Wellbeing", icon: User, href: "/profile" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "admin", label: "Admin", icon: Settings, href: "/admin" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
}

// Engine navigation items (available to all roles)
const engineNavItems = [
  { id: "demo", label: "Quick Demo", icon: Play, href: "/demo" },
  { id: "safety-valve", label: "Safety Valve", icon: Shield },
  { id: "talent-scout", label: "Talent Scout", icon: Sparkles },
  { id: "culture", label: "Culture Temp", icon: Thermometer },
  { id: "network", label: "Network Graph", icon: Network },
  { id: "simulation", label: "Simulation", icon: Zap },
]

export function AppSidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { userRole } = useAuth()
  const userRoleName = userRole?.role || "employee"
  
  // Determine active view from URL
  const currentView = pathname === '/dashboard' 
    ? (searchParams.get('view') || 'dashboard')
    : pathname.split('/')[1] || 'dashboard'

  // Get navigation items based on role
  const navItems = roleBasedNavItems[userRoleName] || roleBasedNavItems.employee

  const handleNavigation = (id: string, href?: string) => {
    if (href) {
      router.push(href)
    } else {
      router.push(`/dashboard?view=${id}`)
    }
    if (onViewChange) onViewChange(id)
  }

  const isActive = (item: { id: string, href?: string }) => {
    const isPageActive = item.href && pathname === item.href
    const isDashboardViewActive = pathname === '/dashboard' && !item.href && currentView === item.id
    const isDefaultDashboard = pathname === '/dashboard' && item.href === '/dashboard' && (!searchParams.get('view') || searchParams.get('view') === 'dashboard')
    return isPageActive || isDashboardViewActive || isDefaultDashboard
  }

  return (
    <aside
      className={`flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))]"
          style={{ boxShadow: "0 0 16px hsl(152 55% 48% / 0.2)" }}>
          <Shield className="h-4.5 w-4.5 text-[hsl(var(--sidebar-primary-foreground))]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Sentinel
            </span>
            <span className="text-[10px] leading-none text-[hsl(var(--sidebar-foreground))]">
              Employee Insights
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            {userRoleName === "admin" ? "Admin" : userRoleName === "manager" ? "Management" : "Personal"}
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isPageActive = item.href && pathname === item.href
            const isActiveItem = isPageActive || (pathname === '/dashboard' && activeView === item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavigation(item.id, item.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActiveItem
                      ? "bg-sidebar-primary text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {!collapsed && (
          <p className="mb-3 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Engines
          </p>
        )}
        {/* Gradient divider */}
        <div className="mx-3 mb-3 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
        <ul className="flex flex-col gap-1">
          {engineNavItems.map((item) => {
            const isActiveItem = pathname === '/dashboard' && activeView === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavigation(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActiveItem
                      ? "bg-sidebar-primary text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3 pb-4">
        {!collapsed && (
          <div className="mb-3 rounded-lg border border-[var(--glass-border)] bg-[hsl(var(--sidebar-accent))] px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))] dot-pulse" />
              <span className="text-[11px] font-medium text-[hsl(var(--sidebar-accent-foreground))]">System Online</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--sidebar-foreground))]">
                <GitBranch className="h-3 w-3" />
                <span>Two-Vault Active</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--sidebar-foreground))]">
                <Activity className="h-3 w-3" />
                <span>Role: {userRoleName}</span>
              </div>
            </div>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg py-2 text-[hsl(var(--sidebar-foreground))]/50 transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
