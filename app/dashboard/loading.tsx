export default function DashboardLoading() {
    return (
        <div className="flex min-h-screen flex-col gap-6 bg-background p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
                    <div className="h-4 w-72 animate-pulse rounded-md bg-muted/60" />
                </div>
                <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
            </div>

            {/* Stat cards skeleton — 6 cards matching StatCards grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                        </div>
                        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted/60" />
                    </div>
                ))}
            </div>

            {/* Main content grid skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left column */}
                <div className="glass-card rounded-xl p-5">
                    <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
                        ))}
                    </div>
                </div>

                {/* Right column — chart + feed */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="h-64 animate-pulse rounded-xl glass-card" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="h-72 animate-pulse rounded-xl glass-card" />
                        <div className="h-72 animate-pulse rounded-xl glass-card" />
                    </div>
                </div>
            </div>
        </div>
    )
}
