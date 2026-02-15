"use client"

import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Unhandled error:", error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                    <svg
                        className="h-8 w-8 text-destructive"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                    An unexpected error occurred. This has been logged automatically.
                </p>
                {error.digest && (
                    <p className="font-mono text-xs text-muted-foreground/60">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
                Try Again
            </button>
        </div>
    )
}
