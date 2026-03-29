"use client"

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  Heart,
  TrendingUp,
  BarChart3,
  User,
  Zap,
  Shield,
  Gem,
  Thermometer,
  Link,
  Plus,
  LogOut,
  User as UserIcon,
  Database,
  FileText,
  Lock,
} from "lucide-react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SettingsModal } from "@/components/settings-modal"
import { createClient } from "@supabase/supabase-js"

interface AppSidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const engineSubItems = [
  { id: "safety", label: "Safety Valve", href: "/engines/safety", icon: Shield },
  { id: "talent", label: "Talent Scout", href: "/engines/talent", icon: Gem },
  { id: "culture", label: "Culture", href: "/engines/culture", icon: Thermometer },
  { id: "network", label: "Network", href: "/engines/network", icon: Link },
]

const primaryNavItems: Record<string, Array<{ id: string; label: string; icon: any; href?: string; isDropdown?: boolean }>> = {
  employee: [
    { id: "ask-sentinel", label: "Ask Sentinel", icon: MessageSquare, href: "/ask-sentinel" },
    { id: "wellbeing", label: "My Wellbeing", icon: Heart, href: "/employee" },
    { id: "progress", label: "Progress Report", icon: TrendingUp, href: "/employee?view=progress" },
    { id: "data-ingestion", label: "Data Pipeline", icon: Database, href: "/data-ingestion" },
  ],
  manager: [
    { id: "ask-sentinel", label: "Ask Sentinel", icon: MessageSquare, href: "/ask-sentinel" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "team-health", label: "Team Health", icon: Heart, href: "/team-health" },
    { id: "data-ingestion", label: "Data Pipeline", icon: Database, href: "/data-ingestion" },
    { id: "audit-log", label: "Audit Log", icon: FileText, href: "/audit-log" },
    { id: "privacy", label: "Privacy", icon: Lock, href: "/privacy" },
    { id: "engines", label: "Engines", icon: Zap, isDropdown: true },
  ],
  admin: [
    { id: "ask-sentinel", label: "Ask Sentinel", icon: MessageSquare, href: "/ask-sentinel" },
    { id: "admin", label: "Admin Panel", icon: Settings, href: "/admin" },
    { id: "team-health", label: "Team Health", icon: Heart, href: "/team-health" },
    { id: "data-ingestion", label: "Data Pipeline", icon: Database, href: "/data-ingestion" },
    { id: "audit-log", label: "Audit Log", icon: FileText, href: "/audit-log" },
    { id: "privacy", label: "Privacy", icon: Lock, href: "/privacy" },
    { id: "engines", label: "Engines", icon: Zap, isDropdown: true },
  ],
}

export function AppSidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, userRole, loading } = useAuth()
  const [enginesOpen, setEnginesOpen] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  if (loading) {
    return (
      <aside className="flex h-full w-[260px] items-center justify-center bg-sidebar">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </aside>
    )
  }
  
  const roleDisplayNames: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    employee: "Team Member",
  }
  
  const userRoleName = userRole?.role || "employee"
  const displayRole = roleDisplayNames[userRoleName] || "Team Member"
  const userName = user?.email?.split('@')[0] || "User"
  const userEmail = user?.email || ""
  
  const currentView = pathname === '/dashboard' 
    ? (searchParams.get('view') || 'dashboard')
    : pathname.split('/')[1] || 'dashboard'

  const navItems = primaryNavItems[userRoleName] || primaryNavItems.employee

  const handleNavigation = (id: string, href: string) => {
    router.push(href)
    if (onViewChange) onViewChange(id)
  }

  const isEngineSubItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href)
  }

  const isEnginesActive = () => {
    return pathname.startsWith('/engines')
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  const renderNavItem = (item: typeof navItems[0]) => {
    if (item.isDropdown) {
      const isActive = isEnginesActive()
      
      if (collapsed) {
        return (
          <Collapsible open={enginesOpen} onOpenChange={setEnginesOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                style={isActive ? { color: 'hsl(var(--primary))' } : undefined}
                title={item.label}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "" : "text-muted-foreground/70 group-hover:text-foreground")} style={isActive ? { color: 'hsl(var(--primary))' } : undefined} />
                {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 px-2 py-1">
              {engineSubItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => handleNavigation(subItem.id, subItem.href)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] cursor-pointer",
                    isEngineSubItemActive(subItem.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )
      }

      return (
        <Collapsible open={enginesOpen} onOpenChange={setEnginesOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/10"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              style={isActive ? { color: 'hsl(var(--primary))' } : undefined}
              >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "" : "text-muted-foreground/70 group-hover:text-foreground")} style={isActive ? { color: 'hsl(var(--primary))' } : undefined} />
                <span>{item.label}</span>
              </div>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", enginesOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 px-2 py-1 ml-3 border-l border-sidebar-border">
            {engineSubItems.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => handleNavigation(subItem.id, subItem.href)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] cursor-pointer",
                  isEngineSubItemActive(subItem.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <subItem.icon className="h-4 w-4 shrink-0" />
                <span>{subItem.label}</span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    const isPageActive = item.href && (
      pathname === item.href || 
      (pathname.startsWith(item.href.split('?')[0]) && item.href !== '/dashboard')
    )
    const activeViewParam = searchParams.get('view')
    const isDashboardView = item.href?.includes('view=') 
        ? activeViewParam === item.href.split('view=')[1] 
        : false;
    
    const isActiveItem = isPageActive || isDashboardView || (pathname === '/dashboard' && !activeViewParam && item.id === 'dashboard')
    
    return (
      <button
        key={item.id}
        onClick={() => item.href && handleNavigation(item.id, item.href)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group relative",
          isActiveItem
            ? "bg-primary/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        style={isActiveItem ? { color: 'hsl(var(--primary))' } : undefined}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActiveItem ? "" : "text-muted-foreground/70 group-hover:text-foreground")} style={isActiveItem ? { color: 'hsl(var(--primary))' } : undefined} />
        {!collapsed && (
            <span>{item.label}</span>
        )}
        {collapsed && isActiveItem && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
        )}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 py-4 h-16">
        <div className="flex items-center gap-3 transition-opacity duration-200">
           <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 shadow-[0_0_10px_-3px_hsl(var(--primary)/0.4)]">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <span className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
                Sentinel
              </span>
              <span className="text-[10px] text-muted-foreground pt-1">
                Employee Insights
              </span>
            </div>
          )}
        </div>
        {!collapsed && onToggleCollapse && (
           <button onClick={onToggleCollapse} aria-label="Toggle sidebar" className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">
              <ChevronLeft className="h-4 w-4" />
           </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-border/80">
        
        {/* Primary Section */}
        <div className="space-y-0.5">
          {navItems.map((item, index) => (
            <div key={item.id || index}>
              {renderNavItem(item)}
            </div>
          ))}
        </div>

        {/* New Chat Button */}
        <div className="space-y-0.5 px-2">
          <button
            onClick={() => router.push("/ask-sentinel")}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group text-primary hover:bg-primary/10"
          >
            <Plus className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

      </nav>

      {/* User Info Footer */}
      <div className="mt-auto border-t border-sidebar-border p-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDropdownOpen(prev => !prev)
            }}
            aria-label="User menu"
            className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent cursor-pointer group"
          >
            <Avatar className="h-9 w-9 rounded-lg border border-border group-hover:border-border/80 transition-colors">
                <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                    {getInitials(userName)}
                </AvatarFallback>
            </Avatar>
            {!collapsed && (
                <div className="flex-1 overflow-hidden text-left">
                    <p className="text-[13px] font-medium text-foreground truncate leading-none group-hover:text-primary transition-colors">
                        {userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-snug pt-1">
                          {displayRole}
                    </p>
                </div>
            )}
            {!collapsed && (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {/* Dropdown Menu */}
          {!collapsed && (
            <div
              role="menu"
              className={cn(dropdownOpen ? "" : "hidden", "absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50")}
            >
              <div className="py-1">
                <SettingsModal
                  trigger={
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                  }
                />
                <button
                  onClick={async () => {
                    const supabase = createClient(
                      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                    )
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-destructive/10 transition-colors text-left"
                  style={{ color: 'hsl(var(--sentinel-critical))' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {collapsed && onToggleCollapse && (
           <button 
               onClick={onToggleCollapse}
               className="mt-2 flex w-full justify-center text-muted-foreground hover:text-foreground p-2 hover:bg-accent rounded-md transition-colors"
             >
               <ChevronRight className="h-4 w-4" />
           </button>
        )}
      </div>
    </aside>
  )
}
