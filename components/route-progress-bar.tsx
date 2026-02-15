'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * RouteProgressBar — NProgress-style top loading bar for route transitions.
 * CSS-only animation (no JS animation library). Shows a teal progress bar
 * that runs across the top of the viewport during navigation.
 */
export function RouteProgressBar() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Start progress on route change
        setLoading(true)
        setProgress(0)

        // Simulate rapid progress ramp
        const t1 = setTimeout(() => setProgress(30), 50)
        const t2 = setTimeout(() => setProgress(60), 200)
        const t3 = setTimeout(() => setProgress(80), 400)
        const t4 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => setLoading(false), 200)
        }, 600)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [pathname])

    if (!loading && progress === 0) return null

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
            style={{ opacity: loading ? 1 : 0, transition: 'opacity 300ms ease' }}
        >
            <div
                className="h-full rounded-r-full"
                style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--sentinel-info)))',
                    boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
                    transition: progress < 100
                        ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                        : 'width 100ms ease-out',
                }}
            />
        </div>
    )
}
