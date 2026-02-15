'use client'

import { useRef, useLayoutEffect } from 'react'

/**
 * useStaggerMount — Orchestrated stagger entrance for child elements.
 * Uses GSAP `gsap.from()` with stagger for cascading card mount animations.
 * Respects `prefers-reduced-motion` via gsap.matchMedia().
 * 
 * @param selector - CSS selector for children to stagger (e.g., '.stat-card')
 * @param deps - React dependency array to re-trigger animation
 * 
 * @example
 * ```tsx
 * function StatCards({ metrics }: Props) {
 *   const containerRef = useStaggerMount('.stat-card', [metrics])
 *   return <div ref={containerRef}>...</div>
 * }
 * ```
 */
export function useStaggerMount(selector: string, deps: unknown[] = []) {
    const containerRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (!containerRef.current) return

        // Dynamic import to keep GSAP out of initial bundle
        let cancelled = false
        import('gsap').then(({ default: gsap }) => {
            if (cancelled || !containerRef.current) return

            const mm = gsap.matchMedia()
            mm.add('(prefers-reduced-motion: no-preference)', () => {
                const ctx = gsap.context(() => {
                    gsap.from(selector, {
                        opacity: 0,
                        y: 8,
                        duration: 0.3,
                        stagger: 0.05,
                        ease: 'power2.out',
                        clearProps: 'all',
                    })
                }, containerRef.current!)
                return () => ctx.revert()
            })

            return () => mm.revert()
        })

        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return containerRef
}
