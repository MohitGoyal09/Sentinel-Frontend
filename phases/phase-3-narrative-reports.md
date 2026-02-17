# Phase 3: Narrative Reports - From Numbers to Stories

## The Story: The Last Translation Layer

Phase 1 gave managers **what to say**. Phase 2 gave everyone **what to ask**. Phase 3 gives every data point **a story**.

Here's the problem: Numbers don't communicate.

```
Velocity: 2.83    →    "Alex's schedule became unpredictable"
Belongingness: 0.25 →   "She's stopped responding to team messages"
Risk: CRITICAL    →    "Consider a supportive check-in"
```

**Phase 3 is the translation layer** between your mathematical engines and human understanding.

---

## The Challenge: The Interpretation Gap

Your Safety Valve calculates:
- Velocity (slope of late-night work)
- Belongingness (social interaction rate)
- Circadian entropy (schedule chaos)

But managers see:
- "Velocity: 2.83"
- "Belongingness: 0.25"

**They don't know what these mean.**

**The Sentinel Approach**: Every metric comes with a narrative explanation.

---

## The Architecture

### 1. Risk Narrative Endpoint

```
GET /api/v1/ai/report/risk/{user_hash}?time_range=30
```

**Output:**
```json
{
  "user_hash": "5e5a554bf23b04bf",
  "narrative": "Your schedule became unpredictable over the past 2 weeks. After sprint end on Tuesday, you've had 3 late nights (10PM+) with no recovery days. Your social interactions have also dropped 40% this week compared to your baseline.",
  "trend": "increasing",
  "key_insights": [
    "Late nights spike after sprint deadlines",
    "Social withdrawal pattern detected",
    "Recovery time has decreased by 60%"
  ],
  "generated_at": "2026-02-15T10:30:00Z"
}
```

### 2. Team Narrative Endpoint

```
GET /api/v1/ai/report/team/{team_hash}?days=30
```

**Output:**
```json
{
  "team_id": "manager_abc123",
  "narrative": "Team of 8 members showing 2 at elevated risk. The team's communication patterns are healthy overall, but we're seeing early signs of workload concentration on 2 key contributors. Consider reviewing task distribution to prevent burnout spread.",
  "trend": "stable",
  "member_count": 8,
  "risk_distribution": {
    "critical": 0,
    "elevated": 2,
    "low": 4,
    "calibrating": 2
  },
  "key_insights": [
    "Workload concentration on 2 key contributors",
    "Cross-team collaboration healthy",
    "No early contagion signals detected"
  ],
  "generated_at": "2026-02-15T10:30:00Z"
}
```

### 3. The Narrative Generation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Raw Data   │ →  │   LLM       │ →  │  Narrative  │
│  (Metrics)  │    │   (Translate)│    │  (Story)    │
└─────────────┘    └─────────────┘    └─────────────┘

Velocity: 2.8   →  "Schedule became unpredictable"
Belonging: 0.2 →  "Social interactions dropped 60%"
Risk: CRITICAL  →  "Consider supportive check-in"
```

---

## The UI Components

### 1. Risk Narrative (Employee View)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Your Risk Narrative                                     │
├─────────────────────────────────────────────────────────────┤
│  Your schedule became unpredictable over the past 2 weeks.  │
│  After sprint end, you've had 3 late nights with no       │
│  recovery days. Your social interactions dropped 40%.      │
│                                                             │
│  📈 Trend: Increasing                                      │
│                                                             │
│  💡 Key Insights:                                          │
│  • Late nights spike after sprint deadlines                │
│  • Social withdrawal pattern detected                      │
│  • Recovery time has decreased                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Team Narrative (Manager View)

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Team Health Narrative                                  │
├─────────────────────────────────────────────────────────────┤
│  Team of 8 members with 2 at elevated risk. Consider       │
│  reviewing workload distribution to prevent burnout spread. │
│                                                             │
│  📈 Trend: Stable                                          │
│                                                             │
│  Risk Distribution:                                         │
│  🔴 Critical: 0  🟡 Elevated: 2  🟢 Low: 4  ⚪ Calibrating: 2│
│                                                             │
│  💡 Key Insights:                                          │
│  • Workload concentration on 2 key contributors          │
│  • Cross-team collaboration healthy                       │
│  • No early contagion signals detected                    │
│                                                             │
│  🔒 Privacy Notice: Individual names hidden unless consent │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-World Scenarios

### Scenario 1: The Self-Aware Employee

**User**: Alex
**View**: `/me` page

1. Alex logs into personal dashboard
2. Sees risk meter showing "ELEVATED"
3. Below it, reads his narrative: "Your schedule became unpredictable..."
4. Understands the pattern: "Oh, it's those post-sprint late nights"
5. Takes action: schedules recovery time

**Result**: Self-awareness leads to self-correction.

### Scenario 2: The Proactive Manager

**User**: Sarah (Manager)
**View**: `/team` page

1. Sarah checks team health
2. Sees team narrative: "2 members at elevated risk"
3. Reviews insights: "Workload concentration on 2 key contributors"
4. Identifies: "Ah, Mike and Lisa are carrying the team"
5. Takes action: rebalances sprint assignments

**Result**: Early intervention prevents burnout spread.

### Scenario 3: The Weekly Digest

**User**: HR Partner
**View**: Automated report

1. Every Monday, receives team health digest
2. Narrative explains: "Team Beta showing early contagion"
3. Insights: "3 members with increasing velocity, high interaction"
4. Takes action: schedules team retro

**Result**: System-wide health monitoring.

---

## Files Created

### Backend
1. **`backend/app/api/v1/endpoints/ai.py`** (Modified)
   - Added `GET /ai/report/risk/{user_hash}` endpoint
   - Added `GET /ai/report/team/{team_hash}` endpoint
   - Added narrative generation using LLM

### Frontend
1. **`frontend/components/ai/RiskNarrative.tsx`** (New)
   - Personal risk narrative display
   - Trend indicator
   - Key insights bullets

2. **`frontend/components/ai/TeamNarrative.tsx`** (New)
   - Team health narrative
   - Risk distribution chart
   - Privacy-safe output

3. **`frontend/lib/api.ts`** (Modified)
   - Added `getRiskNarrative()` function
   - Added `getTeamNarrative()` function

---

## Key Design Decisions

### 1. Why Generate Narratives On-Demand?

**Alternative**: Pre-compute and store narratives

| Approach | Pros | Cons |
|----------|------|------|
| Pre-compute | Faster at scale | Stale data, storage cost |
| On-demand | Always fresh, contextual | Slower generation |

**Decision**: On-demand. Risk changes daily, narratives should too.

### 2. Why Separate Employee vs Team Narratives?

- **Employee narrative**: Personal, focused on self-awareness
- **Team narrative**: Aggregated, privacy-safe, actionable

The same data tells different stories depending on the audience.

### 3. Why Include "Key Insights"?

Numbers are abstract. Insights are actionable.

```
Number:  "Velocity: 2.8"
Insight: "Late nights spike after sprint deadlines"
Action:  "Block post-sprint recovery time"
```

---

## The Narrative Generation Prompt

```python
def generate_risk_narrative(user_data):
    prompt = f"""
    Generate a personal risk narrative in 2-3 sentences.
    
    Data:
    - Velocity: {velocity} (high = erratic schedule)
    - Belongingness: {belongingness} (low = isolated)
    - Recent events: {event_summary}
    
    Guidelines:
    - Write in second person ("Your schedule...")
    - Be specific about patterns
    - Explain WHY (not just WHAT)
    - Keep it actionable
    
    DO NOT mention: "monitoring", "detection", "AI"
    DO: Focus on wellbeing, not warnings
    """
    return llm.generate(prompt)
```

---

## Testing the Reports

### Manual Test

```bash
# Test individual report
curl http://localhost:8000/api/v1/ai/report/risk/5e5a554bf23b04bf?time_range=30

# Test team report
curl http://localhost:8000/api/v1/ai/report/team/manager_abc123?days=30
```

### Expected Response

```json
{
  "user_hash": "...",
  "narrative": "Your schedule became unpredictable...",
  "trend": "increasing",
  "key_insights": [
    "Late nights spike after sprint deadlines"
  ],
  "generated_at": "2026-02-15T..."
}
```

---

## Integration Points

### Employee View (`/me`)
- Risk narrative appears below risk meter
- Updates when user views dashboard

### Manager View (`/team`)
- Team narrative appears in Overview tab
- Updates on page load

### Future: Weekly Digest
- Email delivery of team narratives
- Scheduled job to generate reports

---

## The Complete AI Stack

All three phases now work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL AI LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PHASE 1: Copilot                                          │
│  "What should I say?"                                      │
│  → Generates talking points from risk data                  │
│                                                             │
│  PHASE 2: Query                                            │
│  "What should I ask?"                                      │
│  → Natural language search over data                       │
│                                                             │
│  PHASE 3: Narrative                                        │
│  "What does this mean?"                                    │
│  → Translates metrics to stories                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DATA: RiskScore, Events, RiskHistory, Centrality        │
│  LLM: Gemini/OpenAI via LiteLLM                          │
│  PRIVACY: Role-based filtering, pseudonymization           │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Next: Beyond Phase 3

### Future Enhancements

1. **Weekly Digests**: Automated email reports
2. **Trend Predictions**: "Your risk will likely increase next week because..."
3. **Comparison Narratives**: "You're similar to 30% of recovered employees"
4. **Language Support**: Localized narratives

### The Long-Term Vision

Sentinel becomes a **wellness co-pilot**:
- Proactive suggestions before burnout
- Team health forecasting
- Integration with calendar/HR systems
- Anonymous benchmarking

---

## For Developers

### Customizing Narratives

Modify the prompt in `backend/app/api/v1/endpoints/ai.py`:

```python
# Find generate_risk_narrative() function
# Adjust the prompt template for different tone/length
```

### Adding New Insights

1. Calculate the metric in the endpoint
2. Add to `key_insights` list
3. Update frontend component to display

---

## The Bottom Line

Phase 3 completes the **translation layer** between your mathematical engines and human understanding.

- Numbers become stories
- Metrics become meaning
- Data becomes wisdom

**Your engines calculate. The narratives communicate.**

---

*All Three AI Phases Complete! 🎉*

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL AI SUITE                        │
├─────────────────────────────────────────────────────────────┤
│  ✅ Phase 1: Copilot - Actionable talking points         │
│  ✅ Phase 2: Query - Natural language search              │
│  ✅ Phase 3: Narrative - Human-readable insights          │
├─────────────────────────────────────────────────────────────┤
│  Ready for production deployment!                           │
└─────────────────────────────────────────────────────────────┘
```
