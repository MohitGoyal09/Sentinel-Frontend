# Sentinel Frontend

Next.js 16 + React 19 dashboard for the Sentinel AI-powered employee insight engine. Provides real-time risk monitoring, network visualization, Ask Sentinel AI chat with persistent sessions and SSE streaming, and team health analytics.

**Design system:** `docs/DESIGN.md` documents the full visual language — dark-first palette, Geist font, semantic color tokens, and component patterns.

---

## Table of Contents

- [Frontend Architecture](#frontend-architecture)
- [Pages and Routing](#pages-and-routing)
- [Ask Sentinel Chat](#ask-sentinel-chat)
- [Key Components](#key-components)
- [State Management](#state-management)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)

---

## Frontend Architecture

### Technology Choices

| Concern | Library | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-system routing, Server Components where appropriate |
| Language | TypeScript 5 | Strict mode |
| Font | Geist (by Vercel) | Display and body; Geist Mono for code — loaded via `next/font` |
| Styling | Tailwind CSS 4 | Utility-first; CSS variables for theming |
| Themes | next-themes | Dark (default) and light mode; toggle in sidebar user dropdown |
| UI components | Radix UI + shadcn/ui | Headless primitives with accessible defaults |
| Charts | Recharts | Risk timelines, velocity charts, forecasts |
| Network graph | D3.js v7 | Force-directed social graph |
| Flow canvas | React Flow (XYFlow) | Workflow builder UI |
| Animation | Framer Motion + GSAP | Page transitions and micro-interactions |
| Auth client | Supabase JS (`@supabase/ssr`) | JWT management and session refresh |
| Forms | React Hook Form + Zod v4 | Validated forms throughout |
| Table | TanStack Table v8 | Employee directory and audit log views |
| Drag and drop | dnd-kit | Workflow canvas drag ordering |
| AI streaming | Native `fetch` + `ReadableStream` | SSE token streaming from `/ai/chat/stream` |
| Markdown | react-markdown + streamdown | AI response rendering |
| Notifications | Sonner | Toast notifications |

### Directory Layout

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (ThemeProvider, font loading)
│   ├── page.tsx                # Root redirect (to /dashboard or /login)
│   ├── globals.css             # CSS variables + Tailwind imports
│   ├── favicon.ico
│   ├── error.tsx               # Root error boundary
│   ├── admin/                  # /admin — Admin panel
│   ├── ask-sentinel/           # /ask-sentinel — Ask Sentinel AI chat
│   │   ├── page.tsx            # Main chat page (?conv= session URL param)
│   │   └── history/            # /ask-sentinel/history — conversation list + search
│   ├── audit-log/              # /audit-log — Audit trail viewer
│   ├── auth/                   # /auth/sso — SSO callback handler
│   ├── dashboard/              # /dashboard — Main risk dashboard
│   ├── data-ingestion/         # /data-ingestion — CSV / webhook import
│   ├── demo/                   # /demo — Demo scenarios
│   ├── employee/               # /employee/[hash] — Individual employee view
│   ├── engines/
│   │   ├── safety/             # /engines/safety — Safety Valve UI
│   │   ├── talent/             # /engines/talent — Talent Scout UI
│   │   ├── culture/            # /engines/culture — Culture Thermometer UI
│   │   └── network/            # /engines/network — Network graph
│   ├── login/                  # /login — Authentication page
│   ├── me/                     # /me — Employee self-service
│   ├── notifications/          # /notifications — Notification center
│   ├── onboarding/             # /onboarding — New user wizard (invite flow)
│   ├── privacy/                # /privacy — Privacy policy
│   ├── profile/                # /profile — User profile settings
│   ├── search/                 # /search — Global people search
│   ├── simulation/             # /simulation — Digital twin controls
│   ├── talent-scout/           # /talent-scout — Talent Scout entry
│   ├── team/                   # /team — Team overview
│   ├── team-health/            # /team-health — Team health heatmap
│   └── tenants/                # /tenants — Workspace management
├── components/                 # Reusable React components
│   ├── ai/                     # AI-specific UI elements
│   ├── ai-elements/            # AI response rendering primitives
│   ├── chat/                   # ChatInterface (SSE streaming, AbortController)
│   ├── copilot/                # Manager copilot / agenda components
│   ├── dashboard/              # Dashboard-specific widgets
│   ├── landing-page/           # Marketing/landing page sections
│   ├── layout/                 # Sidebar, header, nav
│   ├── tools/                  # External tool status and controls
│   ├── ui/                     # shadcn/ui primitives
│   ├── activity-feed.tsx       # Real-time activity stream
│   ├── app-sidebar.tsx         # Main navigation sidebar
│   ├── ask-sentinel-widget.tsx # Floating AI assistant widget
│   ├── burnout-cost-calculator.tsx  # ROI calculator UI
│   ├── burnout-prediction.tsx  # Burnout risk gauge
│   ├── command-palette.tsx     # Cmd+K global command palette
│   ├── csv-import-dialog.tsx   # CSV upload dialog
│   ├── employee-table.tsx      # Paginated employee directory
│   ├── executive-summary.tsx   # C-suite summary cards
│   ├── export-report.tsx       # Report export controls
│   ├── forecast-chart.tsx      # SIR contagion forecast chart
│   ├── interactive-graph.tsx   # D3 network graph wrapper
│   ├── network-graph.tsx       # Raw D3 force graph
│   ├── notification-center.tsx # Notification dropdown
│   ├── nudge-card.tsx          # LLM nudge display card
│   ├── protected-route.tsx     # Auth guard wrapper
│   ├── risk-assessment.tsx     # Risk breakdown panel
│   ├── settings-modal.tsx      # User settings modal
│   ├── simulation-panel.tsx    # Digital twin controls
│   ├── skills-radar.tsx        # Skill profile radar chart
│   ├── sparkline.tsx           # Inline trend sparkline
│   ├── stat-cards.tsx          # KPI metric cards
│   ├── team-distribution.tsx   # Team risk distribution chart
│   ├── team-energy-heatmap.tsx # Calendar-style risk heatmap
│   ├── theme-provider.tsx      # next-themes provider
│   ├── theme-toggle.tsx        # Dark/light toggle
│   ├── user-selector.tsx       # Employee search/select combobox
│   ├── vault-status.tsx        # Two-Vault privacy indicator
│   └── velocity-chart.tsx      # Risk velocity over time
├── contexts/
│   ├── auth-context.tsx        # AuthContext — current user, tokens
│   └── tenant-context.tsx      # TenantContext — active workspace
├── hooks/
│   ├── useChatHistory.ts       # API-backed chat history (GET /ai/chat/history)
│   ├── useCountUp.ts           # Animated counter
│   ├── useForecast.ts          # Fetch SIR contagion forecast
│   ├── use-mobile.tsx          # Responsive breakpoint detection
│   ├── useNetworkData.ts       # Fetch and manage graph edges
│   ├── useNudge.ts             # Fetch and dismiss nudges
│   ├── useOrchestrator.ts      # AI agent orchestration calls
│   ├── useRecentEvents.ts      # Activity stream polling
│   ├── useRiskData.ts          # Fetch Safety Valve risk data
│   ├── useRiskHistory.ts       # Fetch historical risk timeline
│   ├── useSimulation.ts        # Persona creation and event injection
│   ├── useStaggerMount.ts      # Staggered animation helper
│   ├── useTeamData.ts          # Team-level analytics
│   ├── use-toast.ts            # Sonner toast helper
│   └── useUsers.ts             # Paginated user directory
├── lib/
│   ├── api.ts                  # Backend API client functions
│   └── utils.ts                # Tailwind class merging + helpers
├── types/
│   └── index.ts                # Shared TypeScript type definitions
├── public/                     # Static assets
├── middleware.ts               # Next.js edge middleware (auth guard)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Pages and Routing

All protected pages check the Supabase session via the edge middleware (`middleware.ts`). Unauthenticated visitors are redirected to `/login`.

### `/dashboard`

Main landing page after login. The layout adapts per role — no tab switching required. Content rendered per role:

**Employee view** — personal risk score, velocity trend, nudge card, own audit trail shortcuts.

**Manager view** — team risk distribution, members at risk, team energy heatmap, SIR forecast, copilot agenda shortcut.

**Admin view** — organization-wide stats, total users, risk distribution across all teams, pipeline health indicator, audit log shortcut.

All views share:
- Stat cards with animated counters
- 30-day risk velocity chart
- Real-time activity feed (WebSocket)
- Active nudge card (if applicable)

### `/ask-sentinel`

Full Ask Sentinel AI chat interface. Features:
- Role-aware system prompt (employee / manager / admin)
- Multi-turn conversation with history
- Streaming token-by-token responses via SSE
- Auto-suggested follow-up questions extracted from `<suggestions>` tags
- Session continuity via `?conv=<session_id>` URL parameter; session UUID is embedded in the SSE `done` event
- Chat history backed by the API (not localStorage)
- Input card with toolbar (attach, model selector) and suggestion carousel
- Workflows section shortcuts beneath the input card (KaraX-inspired layout)
- New Chat button creates a fresh session and navigates to `/ask-sentinel`

### `/ask-sentinel/history`

Conversation history browser. Features:
- Lists sessions fetched from `GET /ai/chat/sessions`
- Client-side search/filter across session titles
- Inline context menu per session: rename, delete, toggle favorite
- Click any session to resume it at `/ask-sentinel?conv=<session_id>`

### `/engines/safety`

Safety Valve detailed view. Shows burnout risk score, velocity meter, circadian indicators, and historical trend chart for any user (subject to RBAC).

### `/engines/talent`

Talent Scout view. Displays network centrality metrics (betweenness, eigenvector, unblocking count) and hidden gem status.

### `/engines/culture`

Culture Thermometer view. Team aggregate health, contagion risk level, and SIR forecast chart.

### `/engines/network`

Interactive D3 force-directed graph of the social collaboration network. Nodes are colored by risk level, sized by betweenness centrality. Click a node to see full details.

### `/simulation`

Demo and testing environment. Create digital twin personas (`alex_burnout`, `sarah_gem`, `jordan_steady`, `maria_contagion`), inject real-time events, and watch the risk scores update live.

### `/me`

Employee self-service. Employees can:
- View their own risk data and audit trail
- Toggle consent settings (share with manager, share anonymized)
- Pause monitoring for a set duration
- Download or delete their data (GDPR)

### `/team` and `/team-health`

Team-level views for managers and admins. Team health heatmap shows daily risk aggregates over a calendar grid.

### `/admin`

Admin-only panel. System health metrics, user list with role management, and organization-wide audit logs.

### `/notifications`

Notification center. Filterable by type (`auth`, `team`, `security`, `activity`). Marks individual or all as read.

### `/data-ingestion`

CSV import and webhook configuration for bulk employee data ingestion.

### `/onboarding`

Multi-step onboarding wizard for new users: workspace setup, team configuration, integration connections.

### `/profile` and `/settings`

User profile (name, avatar, preferences) and application settings (theme, notification preferences).

### `/search`

Global full-text search across employees, surfacing name, role, and risk level.

---

## Ask Sentinel Chat

Built on KaraX streaming patterns with full session persistence.

### SSE streaming

`lib/api.ts` exports `chatWithSentinelStream(message, sessionId, signal)` which opens a native `fetch` stream to `POST /ai/chat/stream` and yields parsed SSE event objects. The `AbortController` signal is forwarded so the user can cancel mid-stream.

```typescript
// Simplified call signature
chatWithSentinelStream(
  message: string,
  sessionId: string | undefined,
  signal: AbortSignal
): AsyncGenerator<SentinelSSEEvent>
```

The SSE `done` event payload includes `session_id` so the frontend can set `?conv=<session_id>` in the URL after the first response, making sessions bookmarkable and refreshable.

### `ChatInterface` component

`components/chat/chat-interface.tsx` — the main chat UI. Responsibilities:
- Renders message list with streaming deltas appended in real time
- Manages `AbortController` lifecycle (cancel button shown while streaming)
- Accepts `initialSessionId` prop to resume a session
- Sets `?conv=<session_id>` URL param after the first response
- Input card with file-attach button, model indicator toolbar, and suggestion carousel
- Workflows section below the input card for quick-action shortcuts

### Session management hooks

`hooks/useChatHistory.ts` — fetches session summaries from the backend.

```typescript
const { sessions, isLoading, error, refetch } = useChatHistory({ limit: 20 })
```

- Calls `GET /ai/chat/sessions?limit=N`
- Returns `ChatSession[]` (id, title, is_favorite, created_at, updated_at)
- Used by the sidebar session list and the `/ask-sentinel/history` page

Additional session API calls (all in `lib/api.ts`):

| Function | Endpoint | Description |
|---|---|---|
| `createChatSession(title)` | `POST /ai/chat/sessions` | Create a new named session |
| `renameChatSession(id, title)` | `PUT /ai/chat/sessions/:id` | Rename session |
| `deleteChatSession(id)` | `DELETE /ai/chat/sessions/:id` | Soft-delete session |
| `toggleSessionFavorite(id)` | `POST /ai/chat/sessions/:id/favorite` | Toggle pin/favorite |
| `getChatSession(id)` | `GET /ai/chat/sessions/:id` | Full session + turns |

---

## Key Components

### `app-sidebar.tsx`

Primary navigation sidebar using Radix UI primitives. There is no separate header bar — all global controls (theme toggle, user menu, tenant switcher) live in the sidebar's footer section.

Key sidebar features:
- Collapse toggle (full → icon-only); state persisted in `localStorage`
- New Chat button at the top of the chat section
- Chat session list with inline context menu (rename, delete, favorite) per session
- User dropdown at the bottom: theme toggle (dark/light), profile link, sign out
- Navigation items are filtered by role (employees do not see admin routes)

### `employee-table.tsx`

TanStack Table v8 powered paginated employee directory. Columns: name, role, risk level (color-coded badge), velocity, last updated. Supports sorting and click-through to the employee detail page.

### `team-energy-heatmap.tsx`

Calendar-grid heatmap showing daily dominant risk level. Each cell is colored `LOW` (green), `ELEVATED` (amber), or `CRITICAL` (red). Fetches from `GET /api/v1/analytics/team-energy-heatmap`.

### `interactive-graph.tsx` / `network-graph.tsx`

D3.js force-directed graph. Nodes represent employees (sized by betweenness centrality, colored by risk level). Edges represent collaboration interactions (weighted by frequency). Hidden gems are outlined in gold.

### `ask-sentinel-widget.tsx`

Floating chat widget that appears on any page. Opens a slide-over panel with the full Ask Sentinel chat interface. Uses `useChatHistory` to surface recent conversations from the backend.

### `nudge-card.tsx`

Displays the current LLM-generated wellbeing nudge for a user. Provides action buttons (dismiss, schedule break, request support) that POST to the appropriate engine endpoint.

### `simulation-panel.tsx`

Controls for the simulation environment. Dropdown to select persona type, email input, "Create Persona" button, and an "Inject Event" control. Displays the activity feed below.

### `burnout-cost-calculator.tsx`

Interactive ROI calculator. Inputs: team size, avg salary, current risk distribution. Outputs: estimated annual burnout cost and projected savings from early intervention.

### `forecast-chart.tsx`

Recharts area chart of the SIR model output. Shows Susceptible, Infected (at risk), and Recovered (resolved) populations over the forecast horizon.

### `protected-route.tsx`

Client-side auth guard wrapper. Checks `AuthContext` for a valid session and redirects to `/login` if absent. Used inside layouts to protect route groups.

### `vault-status.tsx`

Visual indicator showing the Two-Vault privacy status. Confirms that PII is encrypted and that the current operation is operating on hashed data only.

---

## State Management

The application uses React's built-in primitives throughout — no global state library is needed.

### Context Providers

**`AuthContext`** (`contexts/auth-context.tsx`)

Wraps the Supabase JS client. Provides:
- `session` — the current Supabase session (contains access and refresh tokens)
- `user` — the Supabase auth user object
- `userIdentity` — the Sentinel `UserIdentity` record (role, consents, user_hash)
- `signIn(email, password)`, `signOut()`, `refreshSession()`

**`TenantContext`** (`contexts/tenant-context.tsx`)

Tracks the active workspace. Provides:
- `activeTenant` — the current `Tenant` object (id, name, slug, plan)
- `tenants` — list of all workspaces the user belongs to
- `switchTenant(tenantId)` — calls `POST /auth/switch-tenant` and updates the header

### Custom Data Hooks

Each domain has a dedicated hook that encapsulates fetch, loading, error, and refresh state. This keeps page components free of data-fetching logic.

```typescript
// Pattern followed by all data hooks
function useRiskData(userHash: string | null) {
  const [data, setData] = useState<SafetyValveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => { ... }, [userHash]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
```

Key hooks:

| Hook | Data source | Description |
|---|---|---|
| `useRiskData` | `GET /engines/users/{hash}/safety` | Safety Valve result |
| `useRiskHistory` | `GET /engines/users/{hash}/history` | 30-day risk timeline |
| `useNetworkData` | `GET /engines/network/global/talent` | Social graph nodes/edges |
| `useTeamData` | `POST /engines/teams/culture` | Culture Thermometer result |
| `useForecast` | `POST /engines/teams/forecast` | SIR contagion forecast |
| `useUsers` | `GET /engines/users` | Paginated user list |
| `useNudge` | `GET /engines/users/{hash}/nudge` | Current nudge message |
| `useRecentEvents` | `GET /engines/events` | Activity stream |
| `useSimulation` | Multiple engine endpoints | Persona and event injection |
| `useChatHistory` | `GET /ai/chat/sessions` | API-backed session list (title, favorite, timestamps) |
| `useOrchestrator` | AI orchestration endpoints | Agent task execution |

### Real-Time Updates

WebSocket connections are managed individually per component that needs live data. The connection URL format is `ws://{WS_URL}/{user_hash}`.

Incoming message types:
- `risk_update` — new risk score; triggers a re-render of risk-displaying components
- `manual_refresh` — full analysis payload in response to `request_update`
- `pong` — keepalive response

---

## Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
# Required: Backend API base URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Required: WebSocket base URL
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Required: Supabase credentials (must match backend SUPABASE_URL / SUPABASE_KEY)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | Backend WebSocket base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key for client-side auth |

---

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) — install via `npm install -g pnpm`

### Install and run

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server with hot-reload
pnpm dev
```

App runs at `http://localhost:3000`.

### Build for production

```bash
pnpm build
pnpm start
```

### Lint and type check

```bash
# ESLint
pnpm lint

# TypeScript type check
npx tsc --noEmit
```

### Docker

```bash
# From the project root
docker-compose up frontend
```

Or build the frontend image directly:

```bash
cd frontend
docker build -t sentinel-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend:8000/api/v1 \
  -e NEXT_PUBLIC_WS_URL=ws://backend:8000/ws \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  sentinel-frontend
```

### Theming

The application supports dark (default) and light mode via `next-themes`. The active theme is persisted in `localStorage`. Toggle using the `ThemeToggle` component inside the sidebar's user dropdown.

Colors are defined as CSS custom properties in `globals.css` and extended in `tailwind.config.ts`. See `docs/DESIGN.md` for the complete design system including the full token palette, Geist type scale, and component patterns.

The primary accent color is **emerald green** (`#10b981`). The dark theme background is near-black (`#0a0a0a`); the light theme uses standard white surfaces.

Risk-level semantic colors:

| Token | Value | Usage |
|---|---|---|
| Risk LOW | `#22c55e` (green-500) | Healthy badges, chart fills |
| Risk ELEVATED | `#f59e0b` (amber-400) | Warning badges |
| Risk CRITICAL | `#ef4444` (red-500) | Alert badges and indicators |

### Adding a New Page

1. Create a directory under `app/` with a `page.tsx` file.
2. Wrap with `<ProtectedRoute>` if authentication is required.
3. Add a navigation entry in `app-sidebar.tsx`.
4. Create a domain hook in `hooks/` if the page fetches data.

### Adding a New API Call

Add a typed function to `lib/api.ts`. All functions should use the `NEXT_PUBLIC_API_URL` base and attach the Supabase JWT from the auth context as `Authorization: Bearer <token>`.
