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
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

// Navigation items for each role
const roleBasedNavItems: Record<string, Array<{ id: string; label: string; icon: any; href?: string }>> = {
  employee: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
  manager: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
  admin: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "admin", label: "Admin", icon: Settings, href: "/admin" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
}

// Engine navigation items (available to all roles)
const engineNavItems = [
  { id: "safety-valve", label: "Safety Valve", icon: Shield },
  { id: "talent-scout", label: "Talent Scout", icon: Sparkles },
  { id: "culture", label: "Culture Temp", icon: Thermometer },
  { id: "network", label: "Network Graph", icon: Network },
  { id: "simulation", label: "Simulation", icon: Zap },
]

export function AppSidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: AppSidebarProps) {
  const { userRole } = useAuth()
  const userRoleName = userRole?.role || "employee"
  
  // Get navigation items based on role
  const navItems = roleBasedNavItems[userRoleName] || roleBasedNavItems.employee

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Sentinel
            </span>
            <span className="text-[10px] leading-none text-sidebar-foreground">
              Employee Insights
            </span>
          </div>
        )}
      </div>

      {/* Role-Based Navigation */}
      <nav className="flex-1 px-3 pt-2">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            {userRoleName === "admin" ? "Administration" : userRoleName === "manager" ? "Management" : "Personal"}
          </p>
        )}
        <ul className="flex flex-col gap-1 mb-6">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const ButtonContent = (
              <>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </>
            )
            
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-sidebar-primary text-white shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {ButtonContent}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-sidebar-primary text-white shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {ButtonContent}
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {/* Engine Navigation */}
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Engines
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {engineNavItems.map((item) => {
            const isActive = activeView === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
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
          <div className="mb-3 rounded-lg bg-sidebar-accent px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sidebar-primary animate-pulse" />
              <span className="text-[11px] font-medium text-sidebar-accent-foreground">System Online</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground">
                <GitBranch className="h-3 w-3" />
                <span>Two-Vault Active</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground">
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
            className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
