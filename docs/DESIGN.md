# Design System — Sentinel

## Product Context
- **What this is:** AI-powered employee wellbeing platform that detects burnout, identifies hidden talent, and monitors team health
- **Who it's for:** Engineering managers, HR leaders, and employees at tech companies
- **Space/industry:** HR tech, people analytics, employee wellbeing (competitors: Viva Insights, Culture Amp, Lattice, Peakon)
- **Project type:** Enterprise SaaS dashboard with AI chat interface

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — serious tool for serious data
- **Decoration level:** Minimal — typography and spacing do all the work, no gradients, no glows, no decorative elements
- **Mood:** Calm authority. Like a well-designed cockpit instrument panel. The data is the interface. Nothing competes for attention unless it genuinely needs it.
- **Anti-patterns:** No purple gradients, no colored icon circles, no centered-everything layouts, no bouncy animations, no glassmorphism, no decorative blobs

## Typography
- **Display/Hero:** Geist, 24px, font-semibold — clean, modern, built-by-engineers feel
- **Body:** Geist, 14px, font-normal — excellent readability at small sizes
- **UI/Labels:** Geist, 11px, font-medium, uppercase, tracking-wider — clear hierarchy separation
- **Data/Tables:** Geist with tabular-nums, 14px — proper number alignment in data-heavy views
- **Code:** Geist Mono, 13px — consistent with the Geist family
- **Loading:** Already available via Next.js (Vercel's font). Use `next/font/local` or `geist` package.

### Type Scale
```
display:     24px  font-semibold  text-foreground
title:       16px  font-medium    text-foreground
body:        14px  font-normal    text-foreground
body-muted:  14px  font-normal    text-muted-foreground
label:       11px  font-medium    uppercase tracking-wider text-muted-foreground
kpi-value:   28px  font-semibold  tabular-nums text-foreground
kpi-label:   11px  font-medium    uppercase tracking-wider text-muted-foreground
caption:     12px  font-normal    text-muted-foreground/60
```

## Color

### Approach: Restrained
One accent color. Everything else is grayscale. Color is rare and meaningful.

### Palette

```css
/* Backgrounds */
--background:         hsl(0, 0%, 4%);        /* #0a0a0a — page bg */
--surface:            hsl(0, 0%, 8%);        /* #141414 — cards, panels */
--surface-nested:     hsl(0, 0%, 10%);       /* #1a1a1a — elements inside cards */
--surface-hover:      hsl(0, 0%, 12%);       /* #1f1f1f — hover state on surfaces */

/* Borders */
--border:             rgba(255, 255, 255, 0.08);  /* card borders, dividers */
--border-active:      rgba(255, 255, 255, 0.15);  /* focused inputs, active states */

/* Text */
--text-primary:       hsl(0, 0%, 93%);       /* #ededed — headings, primary content */
--text-secondary:     hsl(0, 0%, 50%);       /* #808080 — secondary content, descriptions */
--text-tertiary:      hsl(0, 0%, 30%);       /* #4d4d4d — placeholders, disabled text */

/* Accent — Emerald Green */
--primary:            #10b981;               /* buttons, links, active nav, chart fills */
--primary-foreground: #022c22;               /* text on primary buttons */
--primary-muted:      rgba(16, 185, 129, 0.10);  /* badge backgrounds, subtle highlights */
--primary-bright:     #0df2b9;               /* status dots, "Live" badge, small accents ONLY */

/* Semantic */
--danger:             #ef4444;               /* CRITICAL risk, destructive actions */
--danger-muted:       rgba(239, 68, 68, 0.10);   /* danger badge bg */
--warning:            #f59e0b;               /* ELEVATED risk, caution */
--warning-muted:      rgba(245, 158, 11, 0.10);  /* warning badge bg */
--success:            #10b981;               /* same as primary — LOW risk, healthy */
--success-muted:      rgba(16, 185, 129, 0.10);
--info:               #3b82f6;               /* informational — use sparingly */
--info-muted:         rgba(59, 130, 246, 0.10);
```

### Color Usage Rules
1. Primary green is used for: active nav items, primary buttons, positive metrics, chart lines, links
2. Primary-bright (#0df2b9) is ONLY for: status dots, "Live" badge, very small accents
3. Red is ONLY for: CRITICAL risk badges, destructive action buttons, error states
4. Amber is ONLY for: ELEVATED risk badges, warning alerts
5. No other colors appear in the UI. Everything else is grayscale.
6. Badge backgrounds use the `-muted` variant (10% opacity of the semantic color)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — not cramped, not wasteful

### Scale
```
2xs:   2px    (micro gaps)
xs:    4px    (icon-to-text gaps)
sm:    8px    (tight element spacing)
md:    16px   (card gap, standard spacing)
lg:    20px   (card padding)
xl:    24px   (section gap)
2xl:   32px   (major section separation)
3xl:   48px   (page-level separation)
4xl:   64px   (hero spacing)
```

### Specific Values
- Card inner padding: 20px (`p-5`)
- Card gap (grid): 16px (`gap-4`)
- Section gap: 24px (`gap-6`)
- Page horizontal padding: 24px (`px-6`)

## Layout
- **Approach:** Grid-disciplined — strict columns, predictable alignment, scannable
- **Grid:** 12-column at desktop, 1-column at mobile
- **Max content width:** 1400px (`max-w-[1400px]`)
- **Common splits:** 50/50, 60/40, full-width

### Card Rules
- Background: `var(--surface)` / `bg-[#141414]`
- Border: `border border-white/[0.08]`
- Radius: `rounded-lg` (8px)
- Padding: `p-5` (20px)
- No shadows. No glows. No gradients.
- Hover: `hover:border-white/[0.12]` (subtle border brightening only)

## Border Radius
```
sm:    6px    (badges, small buttons, inputs, chips)
md:    8px    (cards, dropdowns, popovers)
lg:    12px   (modals, large panels, dialogs)
full:  9999px (avatars, status dots, pills, circular buttons)
```

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **No spring, no bounce.** Functional only.

### Duration
```
micro:   50-100ms   (button press, checkbox toggle)
short:   150ms      (hover states, tooltips)
medium:  200ms      (panel expand/collapse, tab switch)
long:    300ms      (modal enter/exit, page transition)
```

### Easing
```
enter:   ease-out     (elements appearing)
exit:    ease-in      (elements disappearing)
move:    ease-in-out  (elements repositioning)
```

## Component Patterns

### Stat Card (KPI)
```
┌─────────────────────────┐
│  LABEL          [icon]  │  ← 11px uppercase tracking-wider muted
│  42.8           ↑ 12%   │  ← 28px semibold tabular-nums + trend
│  Description text       │  ← 12px muted
└─────────────────────────┘
```
- Label on top (tiny, uppercase, muted)
- Large number as the hero element
- Optional trend indicator (arrow + percentage, colored green/red)
- Optional sparkline below the number
- Max 4 per row

### Risk Badge
```
LOW:       bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-md
ELEVATED:  bg-amber-500/10 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-md
CRITICAL:  bg-red-500/10 text-red-400 text-xs font-medium px-2 py-0.5 rounded-md
```
- Flat. No borders. No outlines. Just muted background + colored text.

### Data Table
- No zebra stripes
- Subtle row separator: `border-b border-white/[0.04]`
- Row hover: `hover:bg-white/[0.02]`
- Header: `text-xs uppercase tracking-wider text-muted-foreground`
- Cell: `text-sm text-foreground`
- First column: avatar circle + name

### Section Card
```
┌─────────────────────────────────────┐
│  Section Title            Action →  │  ← 16px medium + link
│  Optional subtitle                  │  ← 14px muted
│                                     │
│  [content area]                     │
│                                     │
└─────────────────────────────────────┘
```

## Light Mode

The app supports both dark (default) and light themes. Theme toggle is in the header. User preference persists via localStorage.

### Light Palette
```css
/* Backgrounds */
--background:         hsl(0, 0%, 100%);       /* #ffffff */
--surface:            hsl(0, 0%, 98%);        /* #fafafa — cards */
--surface-nested:     hsl(0, 0%, 96%);        /* #f5f5f5 — nested elements */
--surface-hover:      hsl(0, 0%, 94%);        /* #f0f0f0 */

/* Borders */
--border:             hsl(0, 0%, 90%);         /* #e5e5e5 */
--border-active:      hsl(0, 0%, 80%);         /* #cccccc */

/* Text */
--text-primary:       hsl(0, 0%, 9%);          /* #171717 */
--text-secondary:     hsl(0, 0%, 45%);         /* #737373 */
--text-tertiary:      hsl(0, 0%, 64%);         /* #a3a3a3 */

/* Accent — emerald-600 for contrast on white */
--primary:            #059669;
--primary-foreground: #ffffff;
--primary-muted:      rgba(5, 150, 105, 0.08);

/* Semantic — 600 shades for white bg contrast */
--danger:             #dc2626;
--danger-muted:       rgba(220, 38, 38, 0.08);
--warning:            #d97706;
--warning-muted:      rgba(217, 119, 6, 0.08);
--success:            #059669;
--success-muted:      rgba(5, 150, 105, 0.08);
--info:               #2563eb;
--info-muted:         rgba(37, 99, 235, 0.08);
```

### Light Mode Rules
1. Primary shifts from emerald-500 (#10b981) to emerald-600 (#059669) for WCAG AA contrast on white
2. Badge opacity drops from 10% to 8% — same perceived intensity on light bg
3. No `primary-bright` (#0df2b9) in light mode — neon green looks terrible on white
4. Risk badge text goes one shade darker: `text-emerald-700`, `text-amber-700`, `text-red-700`
5. Sidebar background: `#f7f7f7` (just off-white, not colored)
6. Chart area fills: 15% opacity (slightly more than dark's 10%)

### What Stays the Same Between Themes
- Typography (Geist, same scale, same weights)
- Spacing (same 4px base, same gaps)
- Border radius (same 6/8/12/full hierarchy)
- Motion (same durations, same easing)
- Layout (same grid, same max-width)
- Component shapes (StatCard, RiskBadge, SectionCard)

## Sidebar Gradient Accent

The sidebar header/logo area is the ONE place a gradient is permitted. It's small, branded, and doesn't compete with data:

```css
/* Sidebar logo bar — subtle emerald gradient */
.sidebar-logo-accent {
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
}
```

This applies ONLY to the logo/brand element at the top of the sidebar. No other gradients anywhere in the app.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-03 | Initial design system created | Replacing ad-hoc hackathon styling with a mature, restrained system inspired by Sage HR and modern enterprise dashboards |
| 2026-04-03 | Chose Geist over Inter | Inter is overused in SaaS. Geist has better tabular-nums support and matches the Next.js/Vercel ecosystem |
| 2026-04-03 | De-saturated primary from #0df2b9 to #10b981 | Electric neon green is overwhelming when used for buttons, links, and chart fills. Keep bright variant for status dots only |
| 2026-04-03 | No gradients rule | Current UI has gradient badges and backgrounds that look "vibecoded." Flat colors are more professional |
| 2026-04-03 | Max 4 KPI cards per row | Current dashboard has 6 stat cards in a row, which is too dense and causes small numbers |
| 2026-04-03 | Removed embedded Ask Sentinel widget from dashboard | Takes too much space. Use a small card that links to /ask-sentinel instead |
| 2026-04-03 | Added light theme | Enterprise users expect theme choice. Dark default, light available via toggle. Primary shifts to emerald-600 for WCAG contrast. |
| 2026-04-03 | Sidebar gradient exception | Subtle emerald gradient on sidebar logo/header area only. Small, branded, doesn't compete with data. User requested. |
| 2026-04-03 | Light mode badge opacity 8% vs dark 10% | Same perceived intensity on opposite backgrounds. Tested visually. |
