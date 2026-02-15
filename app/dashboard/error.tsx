"use client"

import { useEffect } from "react"

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Dashboard error:", error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(var(--sentinel-critical))]/10">
                    <svg
                        className="h-7 w-7 text-[hsl(var(--sentinel-critical))]"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground">Dashboard Error</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                    Failed to load dashboard data. This could be a network issue or the backend may be unavailable.
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Retry
                </button>
                <a
                    href="/"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Go Home
                </a>
            </div>
        </div>
    )
}
