'use client'

/**
 * AmbientBackground — CSS-only animated gradient mesh
 * Creates depth behind page content with minimal perf cost.
 * Uses @property CSS custom property for smooth rotation.
 * Automatically disabled via prefers-reduced-motion in globals.css.
 */
export function AmbientBackground() {
    return <div className="ambient-bg" aria-hidden="true" />
}
