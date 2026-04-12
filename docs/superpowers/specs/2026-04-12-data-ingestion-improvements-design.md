# Data Ingestion Improvements — Design Spec

**Date:** 2026-04-12
**Goal:** Make Sentinel's data ingestion pipeline demo-ready and functionally real — fix broken plumbing, complete GitHub/Slack/Calendar connectors, and add live data flow visualization.
**Context:** AlgoQuest'25 hackathon demo (April 18). Judges include technical evaluators (NatWest VP Data Eng, JK Cement Head of AI) who will probe whether the system works with real data.

## Strategy

**Seed data first, live sync as cherry on top.** The demo always starts with deterministic seed data (Jordan = CRITICAL, Emma = hidden gem). Live connectors prove the pipeline is real. If a live sync fails during demo, seed data saves the dashboard.

Two parallel tracks:
- **Track A (Demo Polish):** Fix broken plumbing + live data flow visualization
- **Track B (Real Connectors):** Complete GitHub + Slack + Calendar end-to-end

## Track A: Demo Polish

### A1. Dynamic Connector Status from Composio

**Problem:** `/api/v1/ingestion/status` hardcodes all connector statuses as `"not_configured"` (ingestion.py lines 111-129). The frontend shows all connectors as disconnected even when GitHub/Slack are connected via the marketplace.

**Fix:**
- In the `/status` endpoint, call `composio_client.get_connected_integrations(entity_id)` to get real connection state
- Map Composio tool slugs (`GITHUB`, `SLACK`, `GOOGLECALENDAR`) to connector names
- Return `"connected"` with `last_sync` timestamp if connected, `"not_configured"` if not
- CSV always shows `"connected"` (no OAuth needed)

**Files:** `backend/app/api/v1/endpoints/ingestion.py`

### A2. Fix CSV Upload Missing tenant_id

**Problem:** The CSV upload endpoint creates `Event` records without setting `tenant_id` (ingestion.py line 314-319). These events are invisible to tenant-scoped engine queries added in the recent security fixes.

**Fix:** Extract `tenant_id` from the authenticated user's `TenantMember` and set it on every created `Event`.

**Files:** `backend/app/api/v1/endpoints/ingestion.py`

### A3. Fix SafetyValve Belongingness Event Type Filter

**Problem:** SafetyValve's `_calculate_belongingness()` filters for `event_type in ["slack_message", "pr_comment"]`, but no connector produces `"pr_comment"` — GitHub PR reviews use `"pr_review"`. This means PR review activity never contributes to the belongingness score.

**Fix:** Change the filter to `["slack_message", "pr_comment", "pr_review"]`.

**Files:** `backend/app/services/safety_valve.py`

### A4. Live Data Flow During Sync

**Problem:** The data-ingestion page polls `/status` every 10 seconds. When a sync runs, the user sees nothing until the next poll. This feels dead during a demo.

**Fix:**
- Add a `syncing` state to the frontend that activates when "Sync Now" is clicked
- During syncing, reduce poll interval from 10s to 2s
- Show a pulsing animation on the pipeline stage that's currently active
- When sync completes, show a toast: "Synced 23 events from GitHub, 15 from Slack"
- Return sync result counts from the `/sync` endpoint response (currently returns generic success)

**Files:**
- `backend/app/api/v1/endpoints/ingestion.py` — enhance `/sync` response with counts
- `frontend/app/data-ingestion/page.tsx` — syncing state, faster polling, result toast

### A5. Engine Recomputation Feedback

**Problem:** After sync, `run_all_engines` fires as a background task but the user gets no feedback about whether risk levels changed.

**Fix:**
- After sync completes, the `/status` endpoint already returns metrics. Add a `last_engine_run` field with timestamp and summary (users analyzed, risk changes detected).
- Frontend shows a brief "Engines recomputed — 2 risk level changes" indicator in the pipeline visualization's final stage.

**Files:**
- `backend/app/api/v1/endpoints/ingestion.py` — track engine run results in `_pipeline_metrics`
- `frontend/app/data-ingestion/page.tsx` — display engine run results

## Track B: Real Connector Completion

### B1. GitHub Sync Creates GraphEdges

**Problem:** `DataSyncService.sync_github()` creates `Event` records for commits but does NOT create `GraphEdge` records. TalentScout's network analysis depends entirely on GraphEdges. Currently, only `sync_slack()` creates edges (for reply threads). This means TalentScout has no data from GitHub activity.

**Fix:** In `sync_github()`, after processing commits:
- If a commit's event type is `pr_review` or a PR-related event, create a `GraphEdge` with:
  - `source_hash` = reviewer's user_hash
  - `target_hash` = PR author's user_hash (if available from Composio data)
  - `edge_type` = `"code_review"`
  - `weight` = based on `comment_length` metadata (longer reviews = stronger signal)
- Deduplicate edges by `(source_hash, target_hash, edge_type)` — update weight if edge exists
- Only create edges when both reviewer and author are identifiable (have user_hash in the tenant). Skip edges where either party is unknown — don't create phantom nodes in the graph.

**Files:** `backend/app/services/data_sync.py`

### B2. Calendar Events Pipeline

**Problem:** `ComposioClient.analyze_meeting_load()` fetches calendar events and produces analysis, but never stores them as `Event` records. Meeting overload is a key burnout signal that SafetyValve should process.

**Fix:** Add `sync_calendar()` to `DataSyncService`:
1. Call Composio to list calendar events for the last 14 days
2. For each event, create an `Event` record:
   - `event_type`: `"meeting"`
   - `metadata_`: `{ "duration_minutes": 60, "attendee_count": 5, "after_hours": true/false, "is_recurring": true/false, "source": "google_calendar", "source_id": "<calendar_event_id>" }`
3. Deduplicate by `source_id`
4. The SafetyValve velocity calculation already handles meetings through the `after_hours` flag — meetings at 20:00 get the +2.0 velocity boost

**SafetyValve change:** No change needed to the engine. The velocity formula already scores any event with `after_hours: true` as +2.0. After-hours meetings naturally contribute to the burnout signal.

**Files:**
- `backend/app/services/data_sync.py` — add `sync_calendar()`
- `backend/app/services/data_sync.py` — update `sync_all_connected()` to include calendar

### B3. Dynamic Connector Cards on Frontend

**Problem:** The data-ingestion page shows 5 static connector cards (Git, Slack, Jira, Calendar, CSV) with hardcoded "not_configured" states. The "Connect" action doesn't link to the OAuth flow.

**Fix:**
- Each connector card reads its status from the `/status` API response (now dynamic per A1)
- If `not_configured`: show "Connect" button that opens the marketplace OAuth popup (reuse the existing `initiateConnection()` from `lib/api.ts`)
- If `connected`: show green status, last sync time, event count, and "Sync Now" button
- On successful OAuth connect, auto-refresh connector status
- Listen for `sentinel:tool-connected` custom event (already dispatched by marketplace) to update status without polling

**Files:** `frontend/app/data-ingestion/page.tsx`

### B4. One-Click Connect & Sync Flow

**Problem:** Currently connecting a tool (marketplace) and syncing data (data-ingestion page) are separate workflows on separate pages. For the demo, this should be seamless.

**Fix:**
- On the data-ingestion page, when a connector's "Connect" button completes OAuth:
  1. Show "Connected!" with green checkmark
  2. Auto-trigger sync for that connector (call `/ingestion/sync?source=github`)
  3. Show events appearing in the live feed
  4. Show engine recomputation result
- The `/sync` endpoint currently syncs ALL connected tools. Add an optional `source` query param to sync just one: `?source=github`, `?source=slack`, `?source=calendar`

**Files:**
- `backend/app/api/v1/endpoints/ingestion.py` — add `source` filter to `/sync`
- `backend/app/services/data_sync.py` — add per-source sync methods
- `frontend/app/data-ingestion/page.tsx` — auto-sync after connect

## Out of Scope

These are explicitly excluded from this spec:

- **Webhook receivers** — Requires public URL, ngrok, etc. Fragile in demo settings.
- **Scheduled/cron sync** — Manual "Sync Now" is sufficient. No Celery/APScheduler.
- **Jira connector completion** — Parser exists but ROI is low for demo. Can add later.
- **Persistent pipeline metrics** — In-memory `_pipeline_metrics` dict is fine for demo. Resets on restart.
- **Error recovery/retry logic** — Seed data is the fallback if live sync fails.
- **Rate limiting on ingestion** — Not needed at demo scale.

## Data Flow Summary

```
                    ┌─────────────────────────────────────────────┐
                    │           DATA INGESTION PAGE               │
                    │  ┌─────────┐ ┌───────┐ ┌────────┐ ┌─────┐ │
                    │  │ GitHub  │ │ Slack │ │Calendar│ │ CSV │ │
                    │  │ Connect │ │Connect│ │Connect │ │Upload│ │
                    │  └────┬────┘ └───┬───┘ └───┬────┘ └──┬──┘ │
                    └───────┼──────────┼─────────┼─────────┼────┘
                            │          │         │         │
                            v          v         v         v
                    ┌───────────────────────────────────────────┐
                    │         DataSyncService                    │
                    │  sync_github() sync_slack() sync_calendar()│
                    │         + CSV direct parse                 │
                    └──────────────┬────────────────────────────┘
                                   │
                    ┌──────────────┼────────────────────────────┐
                    │              v                             │
                    │   ┌─────────────────┐                     │
                    │   │ Privacy Layer    │                     │
                    │   │ HMAC-SHA256 hash │                     │
                    │   │ Fernet encrypt   │                     │
                    │   └────────┬────────┘                     │
                    │            │                               │
                    │   ┌────────v────────┐  ┌───────────────┐  │
                    │   │ analytics.events│  │analytics.edges│  │
                    │   │ (Event table)   │  │(GraphEdge)    │  │
                    │   └────────┬────────┘  └───────┬───────┘  │
                    │            │                    │          │
                    │   ┌────────v────────────────────v───────┐ │
                    │   │         Engine Recomputation         │ │
                    │   │  SafetyValve  TalentScout  Culture  │ │
                    │   └─────────────────┬───────────────────┘ │
                    │                     │                      │
                    │   ┌─────────────────v───────────────────┐ │
                    │   │  risk_scores  centrality  risk_hist │ │
                    │   └─────────────────────────────────────┘ │
                    └───────────────────────────────────────────┘
```

## Event Type Inventory (After Changes)

| event_type | Source | Creates GraphEdge? | Engine Consumer |
|------------|--------|--------------------|-----------------|
| `commit` | GitHub, CSV | No | SafetyValve (velocity) |
| `pr_review` | GitHub, CSV | **Yes (NEW — B1)** | SafetyValve (velocity + belongingness), TalentScout (knowledge_transfer) |
| `slack_message` | Slack, CSV | Yes (on reply) | SafetyValve (velocity + belongingness) |
| `meeting` | **Calendar (NEW — B2)** | No | SafetyValve (velocity, after_hours) |
| `pr_created` | GitHub | No | SafetyValve (velocity) |
| `ticket_completed` | Jira (future) | No | SafetyValve (velocity) |

## Success Criteria

1. Data-ingestion page shows real connector status (green/red) matching actual Composio connections
2. "Connect GitHub" on data-ingestion page opens OAuth → connects → auto-syncs → events appear in live feed
3. GitHub sync creates both Events AND GraphEdges (for PR reviews)
4. Calendar sync creates meeting Events with `after_hours` metadata
5. SafetyValve belongingness includes `pr_review` events
6. CSV upload sets `tenant_id` correctly
7. After sync, user sees "Engines recomputed — N risk changes" feedback
8. All of the above works on top of seed data (additive, not destructive)
