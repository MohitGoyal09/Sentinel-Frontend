'use client'

import { useRef, useEffect, useCallback } from 'react'

/**
 * useCountUp — Animates a number from 0 to target value using GSAP.
 * Displays in monospace `tabular-nums` for stable digit widths.
 * Respects `prefers-reduced-motion` — shows final value immediately.
 * 
 * @param target - The number to count up to
 * @param duration - Animation duration in seconds (default: 0.4)
 * @param decimals - Number of decimal places (default: 0)
 * 
 * @example
 * ```tsx
 * function MetricDisplay({ value }: { value: number }) {
 *   const ref = useCountUp(value, 0.4, 0)
 *   return <span ref={ref} className="font-mono tabular-nums" />
 * }
 * ```
 */
export function useCountUp(target: number, duration = 0.4, decimals = 0) {
    const ref = useRef<HTMLSpanElement>(null)
    const prevTarget = useRef(target)

    const animate = useCallback(() => {
        if (!ref.current) return

        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) {
            ref.current.textContent = typeof target === 'number'
                ? target.toFixed(decimals)
                : String(target)
            return
        }

        const startValue = prevTarget.current
        prevTarget.current = target

        // Dynamic import keeps GSAP out of initial bundle
        import('gsap').then(({ default: gsap }) => {
            if (!ref.current) return

            const proxy = { value: startValue }
            gsap.to(proxy, {
                value: target,
                duration,
                ease: 'power3.out',
                onUpdate: () => {
                    if (ref.current) {
                        ref.current.textContent = proxy.value.toFixed(decimals)
                    }
                },
            })
        })
    }, [target, duration, decimals])

    useEffect(() => {
        animate()
    }, [animate])

    // Set initial value immediately (before GSAP loads)
    useEffect(() => {
        if (ref.current && !ref.current.textContent) {
            ref.current.textContent = '0'
        }
    }, [])

    return ref
}
