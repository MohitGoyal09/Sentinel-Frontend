# Sentinel — Demo Guide

## Quick Start

```bash
# 1. Start backend
cd backend && uv run uvicorn app.main:app --reload

# 2. Start frontend
cd frontend && pnpm dev

# 3. Seed demo data (wipes and recreates everything)
cd backend && uv run python -m scripts.seed_fresh

# 4. Open the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000/docs
```

## Demo Credentials

All users belong to tenant **Acme Technologies**. Password for all accounts: **`Demo123!`**

| Role | Email | What They See |
|------|-------|---------------|
| **Admin** | `admin@acme.com` | Full org view, all teams, all users, audit logs, admin panel |
| **Manager** | `eng.manager@acme.com` | Own wellbeing + Engineering team data (anonymized) |
| **Manager** | `design.manager@acme.com` | Own wellbeing + Design team data |
| **Manager** | `data.lead@acme.com` | Own wellbeing + Data Science team data |
| **Employee** | `dev1@acme.com` | Own wellbeing only (Jordan Lee — CRITICAL) |
| **Employee** | `dev2@acme.com` | Own wellbeing only (Maria Santos — healthy baseline) |

## Seed Data Personas (15 Users, 5 Teams)

### Jordan Lee — THE BURNOUT (CRITICAL)

Senior dev who started working 70-hour weeks after a production incident. Commits at 2-3 AM, stopped replying to Slack, skipping standups, weekend work every week.

- **Velocity: 3.2** (CRITICAL threshold: 2.5) | Confidence: 0.91
- **Belongingness: 0.25** (threshold: 0.3) — declining from 0.55 over 30 days
- **Circadian entropy: >1.5** (computed at runtime from event hour distribution)
- Event patterns: 6-8 events/day, 40% at 20:00-23:00, context switches 8-12
- Week 1: social (Slack + PRs). Week 2: isolated (commits only, minimal Slack)
- Attrition probability: ~85%

### David Kim — THE WARNING (ELEVATED)

Mid-level dev with hours creeping up. Still engaged, but trending toward CRITICAL.

- **Velocity: 2.0** (ELEVATED threshold: 1.5) | Confidence: 0.82
- **Belongingness: 0.40** — borderline social withdrawal
- Event patterns: 4-5 events/day, 30% at 18:00-22:00, 10% after 22:00

### Olivia Zhang — THE ISOLATED (ELEVATED)

Designer becoming disconnected. Not overworking, just withdrawing from team.

- **Velocity: 1.7** | Confidence: 0.80
- **Belongingness: 0.35** — declining from 0.60 over 30 days
- Event patterns: 2-3 events/day normal hours, Slack reply rate 30%, mentions 10%

### Maria Santos — THE HEALTHY (LOW)

Solid contributor with consistent patterns. The control group.

- **Velocity: 0.6** | Confidence: 0.89
- **Belongingness: 0.75** — strong team connections
- Event patterns: 3-4 events/day 09:00-17:30, always replies, 50% mentions others

### Emma Thompson — THE HIDDEN GEM (LOW risk, HIGH network impact)

Quietly bridges Engineering and Design. Moderate commits but unblocks 4-5 people weekly.

- **Betweenness: 0.85** (hidden gem threshold: 0.3)
- **Eigenvector: 0.15** (threshold: <0.2) — not connected to "popular" nodes
- **Unblocking count: 22** (threshold: 5)
- Event patterns: 6-8 events/day, heavily PR review (4x) + unblocked (3x) + code review (2x)
- 7 cross-team blocking edges spanning Engineering, Design, Data Science

### Other Users

| Name | Email | Role | Team | Risk | Brief |
|------|-------|------|------|------|-------|
| Sarah Chen | admin@acme.com | Admin | — | LOW | Balanced exec, pre-seeded chat session |
| James Wilson | cto@acme.com | Admin | — | LOW | Strategic focus |
| Priya Sharma | eng.manager@acme.com | Manager | Engineering | ELEVATED | Overloaded with meetings (4x events) |
| Alex Rivera | design.manager@acme.com | Manager | Design | LOW | Well-organized lead |
| Chen Wei | data.lead@acme.com | Manager | Data Science | LOW | Promoted from employee 15 days ago |
| Noah Patel | designer1@acme.com | Employee | Design | LOW | Consistent contributor |
| Liam Carter | analyst1@acme.com | Employee | Data Science | LOW | Steady analyst |
| Sofia Martinez | analyst2@acme.com | Employee | Data Science | LOW | Consistent analyst |
| Ryan Mitchell | sales1@acme.com | Employee | Sales | LOW | Non-tech persona (email/meetings) |
| Aisha Patel | hr1@acme.com | Employee | People Ops | LOW | Non-tech persona (meetings/tickets) |

## Seed Data Volume

| Data Type | Count |
|-----------|-------|
| Users | 15 (Supabase Auth + DB) |
| Teams | 5 (Engineering, Design, Data Science, Sales, People Ops) |
| Events | 624 (14 days of persona-driven behavioral data) |
| Risk history | 450 (30 entries per user with trending trajectories) |
| Graph edges | 60 (intra-team clusters + Emma's cross-team bridges) |
| Centrality scores | 15 (curated per persona) |
| Skill profiles | 15 (6-axis: technical, communication, leadership, collaboration, adaptability, creativity) |
| Audit logs | 116 (12 action types including identity reveal, consent changes) |
| Chat sessions | 2 (admin "Who is at risk?" + employee "How am I doing?") |
| Notifications | 69 with 150 preferences |

Risk distribution: **1 CRITICAL, 3 ELEVATED, 11 LOW**

All seed data is deterministic (`Random(42)`) — same script produces identical data every run.

## Demo Script (3 Minutes)

### Minute 1 — The Problem + Admin View (60s)

> "76% of employees experience burnout. Current detection happens in exit interviews — 6 months too late. Sentinel catches it 30 days earlier."

1. Login as `admin@acme.com` / `Demo123!`
2. Show dashboard: org overview, risk distribution (1 CRITICAL, 3 ELEVATED, 11 LOW)
3. Point to team health map — Engineering team is elevated

### Minute 2 — The Engine (60s)

1. Navigate to Safety Valve engine
2. Show Jordan Lee (CRITICAL): velocity 3.2, confidence 91%
3. Point to indicators: chaotic hours, social withdrawal, sustained intensity
4. Say: "This is math, not AI opinion. Velocity is linear regression. Belongingness is response rate. Entropy is Shannon's formula."
5. Click "Generate 1:1 Agenda" — show AI-generated talking points

### Minute 3 — Privacy + Network (60s)

1. Switch to Talent Scout: show network graph
2. Point to Emma (hidden gem): "Betweenness 0.85, unblocking 22, eigenvector 0.15. She holds two teams together — invisible to traditional metrics."
3. Privacy pitch: "We never see message content. Analytics DB has only anonymous hashes and timestamps. Two separate vaults, no JOIN possible without the vault key."

## Engine Thresholds (for Q&A)

| Metric | CRITICAL | ELEVATED | LOW |
|--------|----------|----------|-----|
| Velocity (linregress slope) | > 2.5 | > 1.5 | <= 1.5 |
| Belongingness (reply/mention rate) | < 0.3 | < 0.4 | >= 0.4 |
| Circadian entropy (Shannon) | > 1.5 | > 1.0 | <= 1.0 |
| CRITICAL requires ALL THREE | velocity > 2.5 AND belonging < 0.3 AND entropy > 1.5 |

| Talent Scout | Hidden Gem Threshold |
|---|---|
| Betweenness centrality | > 0.3 |
| Eigenvector centrality | < 0.2 |
| Unblocking count | > 5 |

## What NOT to Say

| Do Not Say | Say Instead |
|------------|-------------|
| "We use AI" | "We use mathematical models — AI only writes the text" |
| "We predict behavior" | "We identify pattern changes from personal baselines" |
| "We identify high performers" | "We find structurally critical people at retention risk" |
| "30-day prediction" | "Early warning signals" (until validated) |
| "Automated interventions" | "Insights and recommendations — humans decide" |

## Known Demo Failure Points

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM API key expired/rate-limited | High | Test `GEMINI_API_KEY` 30 min before demo |
| Supabase free tier cold start | Medium | Hit `/health` endpoint 5 min before |
| Redis not running | Medium | Chat works without Redis (degrades gracefully) |
| Backend not running | High | Check `curl http://localhost:8000/health` |
| Wrong credentials | Medium | All users: `Demo123!` — no role-specific passwords |
