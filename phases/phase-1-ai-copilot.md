# Phase 1: AI Copilot - From Data to Action

## The Story: From Dashboard to Dialogue

Phase 0 gave us data. Phase 1 gives us **dialogue**.

You've built an impressive detection system—Safety Valve flags burnout, Talent Scout finds hidden gems, Culture Thermometer spots contagion. But here's the problem: **data without action is just information**.

A manager seeing "Risk: CRITICAL" doesn't know what to do next. Do they schedule a meeting? Send a Slack message? What do they even say?

**Phase 1 transforms your engines from dashboards into conversations.**

## The Challenge: The Last-Mile Problem

Here's where most analytics platforms fail:

```
Manager sees: "Alex Chen - CRITICAL risk (velocity: 2.8)"
Manager thinks: "😰 Um... okay? What do I do with this?"

Traditional Analytics: "Here's your data, good luck!"
Sentinel Copilot: "Here's what to say and how to help."
```

**The Sentinel Approach**: Every alert comes with an AI-generated action plan.

---

## The Architecture

### 1. The Copilot Endpoint

```
POST /api/v1/ai/copilot/agenda
```

**Input:**
```json
{
  "user_hash": "5e5a554bf23b04bf"
}
```

**Output:**
```json
{
  "user_hash": "5e5a554bf23b04bf",
  "risk_level": "ELEVATED",
  "talking_points": [
    {
      "text": "I've noticed your schedule has been extending later recently. How are you feeling about your current workload?",
      "type": "supportive"
    },
    {
      "text": "Want to protect your focus time tomorrow morning?",
      "type": "action"
    },
    {
      "text": "Shall we block some time this week to discuss how things are going?",
      "type": "question"
    }
  ],
  "suggested_actions": [
    {"label": "Schedule 1:1", "action": "calendar_invite"},
    {"label": "Edit Points", "action": "edit"},
    {"label": "Dismiss", "action": "dismiss"}
  ],
  "generated_at": "2026-02-15T10:30:00Z"
}
```

### 2. The Prompt Engineering

We don't just dump data into the LLM. We use a carefully crafted prompt:

```
You are a supportive manager copilot. Generate a brief, caring 1:1 agenda.

Risk Data:
- Risk Level: {risk_level}
- Velocity: {velocity} (higher = more erratic hours)
- Belongingness: {belongingness} (lower = less social interaction)
- Recent Pattern: {pattern_summary}

Context:
- On-call: {on_call}
- Sprint End: {sprint_end}
- Baseline: {user_baseline}

Generate 3 talking points that are:
- Brief (1 sentence each)
- Protective (focus on support, not problems)
- Actionable (include specific suggestions)

DO NOT mention: "burnout", "monitoring", "AI detection"
DO: Frame positively, protect employee dignity
```

**Why This Design:**

1. **Privacy-first language**: Never mentions "burnout" or "monitoring"
2. **Supportive framing**: "How's your workload?" not "You're burning out"
3. **Actionable**: Each point suggests a concrete next step
4. **Context-aware**: Factors in on-call, sprints, personal baseline

### 3. The UI Component

The frontend shows an "AI Generate" button on every risk alert:

### Features
- **Gradient header** with risk-appropriate colors (amber/orange for elevated/critical)
- **Expandable interface** - shows full agenda on click
- **Animated loading** with skeleton states
- **Risk-aware styling** - different gradients for different risk levels
- **Tips section** with best practices for 1:1s

```
┌─────────────────────────────────────────────────────────────┐
│  🔥 Safety Valve                              [ELEVATED] [AI]│
│  ─────────────────────────────────────────────────────────── │
│                                                             │
│  Employee: Alex Chen                                        │
│  Pattern: Late nights +3 days this week                    │
│  Context: Post-sprint, unexplained                         │
│                                                             │
│  [  Generate 1:1 Agenda  ]                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI-Generated Talking Points               [3 pts]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  1. "I noticed you've been working late—          │   │
│  │        how's your workload?"                       │   │
│  │  2. "Want to protect your focus time?"             │   │
│  │  3. "Shall I block tomorrow morning?"              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Tip: Start with open-ended questions...                │
│                                                             │
│  [Schedule] [Edit] [✕]                                    │
└─────────────────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────┐
│  🔥 SAFETY VALVE - Alex (ELEVATED)                    [AI] │
├─────────────────────────────────────────────────────────────┤
│  Pattern: Late nights +3 days this week                   │
│  Context: Post-sprint, unexplained                       │
│                                                             │
│  [Generate 1:1 Agenda]                                    │
│                                                             │
│  📋 Suggested Talking Points:                               │
│  1. "I noticed you've been working late—how's         │
│     workload?"                                             │
│  2. "Want to protect your focus time?"                    │
│  3. "Shall I block tomorrow morning?"                    │
│                                                             │
│  [Schedule] [Edit] [Dismiss]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-World Scenarios

### Scenario 1: The Proactive Manager

**User**: Sarah (Engineering Manager)
**View**: Team dashboard

1. Sarah sees "Alex - ELEVATED risk" on her team view
2. She clicks [Generate 1:1 Agenda]
3. AI generates talking points based on Alex's velocity + belongingness
4. Sarah reviews points, clicks [Schedule]
5. Calendar invite pre-filled with agenda items sent

**Result**: Early intervention, no crisis.

### Scenario 2: The Supportive Framing

**Before (Traditional)**:
> "⚠️ Alert: Employee at risk of burnout. Velocity: 2.8. Immediate intervention required."

**After (Sentinel Copilot)**:
> "I've noticed your schedule has been extending later recently. How are you feeling about your current workload? Want to protect your focus time tomorrow morning?"

**The Difference**: One sounds like a fire alarm, the other sounds like a supportive colleague.

### Scenario 3: The Context Filter

**Input**: User is on-call (detected via PagerDuty integration)

**AI Output**:
> "I see you've had some late nights this week. Are you still on-call rotation? Let's make sure you're getting adequate recovery time when your shift ends."

**Why it matters**: AI recognizes context and adjusts the narrative. No false positives.

---

## Files Created

### Backend
1. **`backend/app/api/v1/endpoints/ai.py`** (New)
   - `POST /ai/copilot/agenda` - Generate 1:1 talking points
   - Uses existing LLM service
   - Fetches data from RiskScore, Events, RiskHistory

### Frontend
1. **`frontend/components/copilot/AgendaGenerator.tsx`** (New)
   - AI Generate button with sparkle icon
   - Displays talking points in polished UI
   - Action buttons (Schedule, Edit, Dismiss)

2. **`frontend/lib/api.ts`** (Modified)
   - Added `generateAgenda(userHash)` function

---

## Key Design Decisions

### 1. Why Use LLM for Talking Points?

**Alternative**: Hard-coded templates

| Approach | Pros | Cons |
|----------|------|------|
| Templates | Fast, consistent | Feels robotic, doesn't adapt |
| LLM | Natural, contextual | Slower, requires API |

**Decision**: LLM wins for human interaction. The marginal cost is worth the quality improvement.

### 2. Why Three Talking Points?

- **1 point**: Too few, might miss context
- **2 points**: Better, but gap between "how are you?" and action
- **3 points**: Perfect balance
  - 1st: Open-ended (listening)
  - 2nd: Protective framing (agency)
  - 3rd: Concrete action

### 3. Why "Supportive" Language Only?

We've explicitly programmed the AI to avoid:
- "burnout" (too clinical/alarming)
- "monitoring" (sounds surveillance-y)
- "AI detection" (black box fear)
- "intervention" (too medical)

We emphasize:
- "support" (helping hand)
- "protect" (empowering)
- "wellbeing" (holistic)
- "check-in" (casual, non-threatening)

---

## The Deterministic Sandwich (Review)

Remember from the architecture: **LLM sees math output, never raw data**.

```
┌─────────────────────────────────────────────────────────────┐
│                    DETERMINISTIC SANDWICH                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Ingestion    → Python validation                │
│  Layer 2: Analysis      → NumPy/SciPy (VELOCITY = 2.8)   │
│  Layer 3: Generation    → LLM ("Late nights increasing")  │
├─────────────────────────────────────────────────────────────┤
│  RULE: LLM sees math output, never raw data                │
│  RULE: Decisions are math, text is AI                      │
└─────────────────────────────────────────────────────────────┘
```

The LLM receives: `"Velocity: 2.8, Belongingness: 0.25"`
The LLM generates: `"I've noticed your schedule extending..."`

**Privacy preserved, insights enhanced.**

---

## Testing the Copilot

### Manual Test

```bash
# Start backend
cd backend && uvicorn app.main:app --reload

# Test endpoint
curl -X POST http://localhost:8000/api/v1/ai/copilot/agenda \
  -H "Content-Type: application/json" \
  -d '{"user_hash": "5e5a554bf23b04bf"}'
```

### Expected Response

```json
{
  "user_hash": "5e5a554bf23b04bf",
  "risk_level": "ELEVATED",
  "talking_points": [
    {"text": "...", "type": "supportive"},
    {"text": "...", "type": "action"},
    {"text": "...", "type": "question"}
  ],
  "suggested_actions": [
    {"label": "Schedule 1:1", "action": "calendar_invite"},
    {"label": "Edit Points", "action": "edit"},
    {"label": "Dismiss", "action": "dismiss"}
  ],
  "generated_at": "2026-02-15T..."
}
```

---

## What's Next: Phase 2

Now that managers can act, let's empower **anyone** to ask questions:

> "Who knows PostgreSQL and isn't burned out?"
> "Which team members are at risk?"

**Phase 2: Semantic Query Engine** - Natural language search over your entire employee graph.

---

## For Developers

### Adding New Copilot Features

1. Add endpoint in `backend/app/api/v1/endpoints/ai.py`
2. Create prompt template in the function
3. Add frontend component in `frontend/components/copilot/`
4. Test with real data

### Configuration

The LLM is configured in `backend/app/config.py`:
```python
llm_provider: str = "gemini"  # or "openai", "anthropic"
llm_model: str = "gemini-pro"
llm_api_key: str = os.getenv("LLM_API_KEY", "")
```

Set your API key in `.env`:
```bash
LLM_API_KEY=your_api_key_here
```

---

## The Bottom Line

Phase 1 transforms Sentinel from a **dashboard** into a **dialogue system**.

- Managers don't just see numbers—they get actionable scripts
- Employees don't just get flagged—they get supportive outreach
- The system doesn't just detect—it **resolves**

**From insight to action. That's the copilot difference.**

---

*Phase 1 Complete. Onward to Phase 2! 🚀*
