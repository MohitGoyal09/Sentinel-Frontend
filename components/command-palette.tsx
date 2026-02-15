'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
    Search,
    LayoutDashboard,
    Shield,
    Sparkles,
    Thermometer,
    Network,
    Zap,
    User,
    Users,
    Settings,
    ArrowRight,
    Command,
} from 'lucide-react'

interface CommandItem {
    id: string
    label: string
    category: 'navigation' | 'actions' | 'people'
    icon: React.ComponentType<{ className?: string }>
    shortcut?: string
    action: () => void
}

interface CommandPaletteProps {
    onNavigate: (view: string) => void
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)

    // All available commands
    const allItems: CommandItem[] = useMemo(
        () => [
            // Navigation
            { id: 'dashboard', label: 'Go to Dashboard', category: 'navigation', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
            { id: 'safety-valve', label: 'Safety Valve Engine', category: 'navigation', icon: Shield, action: () => onNavigate('safety-valve') },
            { id: 'talent-scout', label: 'Talent Scout Engine', category: 'navigation', icon: Sparkles, action: () => onNavigate('talent-scout') },
            { id: 'culture', label: 'Culture Thermometer', category: 'navigation', icon: Thermometer, action: () => onNavigate('culture') },
            { id: 'network', label: 'Network Graph', category: 'navigation', icon: Network, action: () => onNavigate('network') },
            { id: 'simulation', label: 'Simulation Engine', category: 'navigation', icon: Zap, action: () => onNavigate('simulation') },
            { id: 'me', label: 'My Wellbeing', category: 'navigation', icon: User, action: () => onNavigate('me') },
            { id: 'team', label: 'My Team', category: 'navigation', icon: Users, action: () => onNavigate('team') },
            { id: 'admin', label: 'Admin Panel', category: 'navigation', icon: Settings, action: () => onNavigate('admin') },
            // Actions
            { id: 'toggle-sidebar', label: 'Toggle Sidebar', category: 'actions', icon: ArrowRight, shortcut: '[', action: () => { /* handled externally */ } },
        ],
        [onNavigate]
    )

    // Filter items by query
    const filteredItems = useMemo(() => {
        if (!query.trim()) return allItems
        const lower = query.toLowerCase()
        return allItems.filter(
            (item) =>
                item.label.toLowerCase().includes(lower) ||
                item.category.toLowerCase().includes(lower) ||
                item.id.toLowerCase().includes(lower)
        )
    }, [query, allItems])

    // Group items by category
    const grouped = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {}
        for (const item of filteredItems) {
            if (!groups[item.category]) groups[item.category] = []
            groups[item.category].push(item)
        }
        return groups
    }, [filteredItems])

    // Flatten for arrow key navigation
    const flatItems = useMemo(() => filteredItems, [filteredItems])

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(0)
    }, [query])

    // Open/close with ⌘K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setQuery('')
            setActiveIndex(0)
            // Wait for portal to render
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [open])

    // GSAP entrance/exit
    useEffect(() => {
        if (!open) return
        import('gsap').then(({ default: gsap }) => {
            const mm = gsap.matchMedia()
            mm.add('(prefers-reduced-motion: no-preference)', () => {
                if (backdropRef.current) {
                    gsap.from(backdropRef.current, { opacity: 0, duration: 0.15 })
                }
                const panel = backdropRef.current?.querySelector('.command-panel')
                if (panel) {
                    gsap.from(panel, { opacity: 0, y: -8, scale: 0.98, duration: 0.2, ease: 'power2.out' })
                }
                return () => mm.revert()
            })
        })
    }, [open])

    const executeItem = useCallback(
        (item: CommandItem) => {
            item.action()
            setOpen(false)
        },
        []
    )

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setActiveIndex((prev) => (prev + 1) % flatItems.length)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
                    break
                case 'Enter':
                    e.preventDefault()
                    if (flatItems[activeIndex]) executeItem(flatItems[activeIndex])
                    break
                case 'Escape':
                    e.preventDefault()
                    setOpen(false)
                    break
            }
        },
        [flatItems, activeIndex, executeItem]
    )

    // Scroll active item into view
    useEffect(() => {
        const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
        activeEl?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    if (!open) return null

    const categoryLabels: Record<string, string> = {
        navigation: '🔍 Navigation',
        actions: '⚡ Actions',
        people: '👤 People',
    }

    return createPortal(
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false)
            }}
            style={{ background: 'hsl(222 22% 8% / 0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div className="command-panel glass-card w-full max-w-lg rounded-2xl shadow-2xl" onKeyDown={handleKeyDown}>
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search engines, pages, actions..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-mono"
                    />
                    <kbd className="hidden rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60 sm:inline">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
                    {flatItems.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, items]) => (
                            <div key={category} className="mb-2 last:mb-0">
                                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                                    {categoryLabels[category] || category}
                                </p>
                                {items.map((item) => {
                                    const globalIndex = flatItems.indexOf(item)
                                    const isActive = globalIndex === activeIndex
                                    return (
                                        <button
                                            key={item.id}
                                            data-index={globalIndex}
                                            type="button"
                                            onClick={() => executeItem(item)}
                                            onMouseEnter={() => setActiveIndex(globalIndex)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors duration-75 ${isActive
                                                    ? 'bg-[hsl(var(--primary))]/10 text-foreground'
                                                    : 'text-muted-foreground hover:bg-[hsl(var(--muted))]/50'
                                                }`}
                                        >
                                            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : ''}`} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.shortcut && (
                                                <kbd className="rounded border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/40">
                                                    {item.shortcut}
                                                </kbd>
                                            )}
                                            {isActive && (
                                                <ArrowRight className="h-3 w-3 text-[hsl(var(--primary))]" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-4 py-2">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-[var(--glass-border)] px-1 py-0.5 font-mono">↑↓</kbd> navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-[var(--glass-border)] px-1 py-0.5 font-mono">↵</kbd> select
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                        <Command className="h-3 w-3" />
                        <span className="font-mono">K</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
