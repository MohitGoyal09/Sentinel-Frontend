'use client'

import { useMemo, useId } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
    /** Array of numeric values (7-day trend) */
    data: number[]
    /** Width in px (default: 64) */
    width?: number
    /** Height in px (default: 24) */
    height?: number
    /** Stroke color — CSS color string */
    color?: string
    /** Whether to show area fill (default: true) */
    showFill?: boolean
    /** Additional class names */
    className?: string
}

/**
 * Sparkline — Zero-dependency inline SVG micro-chart.
 * Renders a 7-day (or N-point) trend line with animated stroke draw-on
 * and optional area fill. Uses `stroke-dashoffset` animation from globals.css.
 *
 * @example
 * ```tsx
 * <Sparkline data={[3, 5, 2, 8, 4, 6, 7]} color="hsl(var(--sentinel-healthy))" />
 * ```
 */
export function Sparkline({
    data,
    width = 64,
    height = 24,
    color = 'hsl(var(--primary))',
    showFill = true,
    className,
}: SparklineProps) {
    const gradientId = useId()

    const { points, areaPath, pathLength } = useMemo(() => {
        if (!data?.length) return { points: '', areaPath: '', pathLength: 0 }

        const min = Math.min(...data)
        const max = Math.max(...data)
        const range = max - min || 1
        const padding = 2 // px padding top/bottom

        const coords = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width
            const y = height - padding - ((val - min) / range) * (height - padding * 2)
            return { x, y }
        })

        const polyline = coords.map((p) => `${p.x},${p.y}`).join(' ')
        const area = [
            `M ${coords[0].x},${height}`,
            `L ${coords.map((p) => `${p.x},${p.y}`).join(' L ')}`,
            `L ${coords[coords.length - 1].x},${height}`,
            'Z',
        ].join(' ')

        // Calculate approximate path length for animation
        let len = 0
        for (let i = 1; i < coords.length; i++) {
            const dx = coords[i].x - coords[i - 1].x
            const dy = coords[i].y - coords[i - 1].y
            len += Math.sqrt(dx * dx + dy * dy)
        }

        return { points: polyline, areaPath: area, pathLength: Math.ceil(len) }
    }, [data, width, height])

    if (!data?.length) return null

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            className={cn('inline-block', className)}
            aria-hidden="true"
        >
            {/* Area fill gradient */}
            {showFill && (
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
            )}

            {/* Area fill */}
            {showFill && areaPath && (
                <path
                    d={areaPath}
                    fill={`url(#${gradientId})`}
                    className="sparkline-area"
                />
            )}

            {/* Line */}
            {points && (
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="sparkline-draw"
                    style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: pathLength,
                        animation: `sparkline-draw 0.8s ease-out 0.3s forwards`,
                    }}
                />
            )}

            {/* End dot */}
            {data.length > 0 && (() => {
                const min = Math.min(...data)
                const max = Math.max(...data)
                const range = max - min || 1
                const padding = 2
                const lastVal = data[data.length - 1]
                const cx = width
                const cy = height - padding - ((lastVal - min) / range) * (height - padding * 2)
                return (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={2}
                        fill={color}
                        className="sparkline-dot"
                        style={{
                            opacity: 0,
                            animation: `sparkline-dot-appear 0.3s ease-out 1.1s forwards`,
                        }}
                    />
                )
            })()}
        </svg>
    )
}
