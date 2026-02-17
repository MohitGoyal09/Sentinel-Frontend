# Phase 2: Semantic Query Engine - Search Without SQL

## The Story: From Filters to Questions

Phase 1 gave managers **actionable scripts**. Phase 2 gives **everyone** the power to query your entire employee graph using natural language.

No more:
- "Click Filters → Risk Level → ELEVATED → Apply"
- "Export CSV → Open Excel → Pivot Table → Filter"

Now you just type:
> "Who knows PostgreSQL and isn't burned out?"

And the AI does the rest.

---

## The Challenge: The Query Gap

Most analytics platforms force users to think like databases:

```
User thinking: "Who on my team is at risk but hasn't spoken up?"
SQL thinking:   SELECT * FROM users WHERE risk_level = 'ELEVATED' AND belongs_to_team = 'X'

User thinking: "Find hidden gems with high betweenness"
SQL thinking:  SELECT * FROM centrality WHERE betweenness > 0.3 AND unblocking_count > 5
```

**The Sentinel Approach**: Users think in questions, AI translates to queries.

---

## The Architecture

### 1. The Query Endpoint

```
POST /api/v1/ai/query
```

**Input:**
```json
{
  "query": "Who knows PostgreSQL and isn't burned out?",
  "user_role": "manager"
}
```

**Output:**
```json
{
  "query": "Who knows PostgreSQL and isn't burned out?",
  "response": "Based on your query, I found 3 people who match your criteria:\n\n1. **Sarah Chen** - High betweenness (0.42), LOW risk. She's a key connector between the backend and platform teams.\n2. **Mike Johnson** - Moderate centrality, LOW risk. Strong PostgreSQL expertise.\n3. **Lisa Wang** - Rising talent, LOW risk. Recently upskilled in PostgreSQL.",
  "results": [
    {
      "user_hash": "abc123",
      "pseudonym": "User A",
      "risk_level": "LOW",
      "betweenness": 0.42,
      "unblocking_count": 12,
      "skills": ["PostgreSQL", "Python"]
    },
    {
      "user_hash": "def456",
      "pseudonym": "User B",
      "risk_level": "LOW",
      "betweenness": 0.28,
      "unblocking_count": 8,
      "skills": ["PostgreSQL", "Go"]
    }
  ]
}
```

### 2. Query Intent Parser

The system parses natural language to understand what the user is looking for:

| Query Pattern | Intent | Database Query |
|---------------|--------|----------------|
| "who is at risk?" | risk_query | RiskScore WHERE risk_level IN (ELEVATED, CRITICAL) |
| "who knows X?" | skill_query | Centrality + manual skill mapping |
| "hidden gems" | talent_query | Centrality WHERE betweenness > 0.3 AND unblocking > 5 |
| "flight risk" | attrition_query | RiskHistory trending up + low belongingness |
| "burned out" | burnout_query | RiskScore WHERE risk_level = CRITICAL |

### 3. The Privacy Filter

Before returning results, the system applies role-based filters:

```python
def apply_role_filter(results, user_role, current_user_hash):
    if user_role == "employee":
        # Employees see only themselves
        return [r for r in results if r.user_hash == current_user_hash]
    
    elif user_role == "manager":
        # Managers see team members with consent OR critical risk
        return [
            r for r in results 
            if r.consent_share_with_manager or r.risk_level == "CRITICAL"
        ]
    
    else:  # admin
        return results  # See everything
```

---

## The UI Component

The "Ask Sentinel" search bar appears at the top of the dashboard:

### Features
- **Gradient header** with bot icon and AI badge
- **Search input** with sample query suggestions
- **Results cards** with risk badges and suggested actions
- **Markdown rendering** for rich AI responses
- **Loading states** with animated indicators

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Ask Sentinel                                    [AI]  │
│  ───────────────────────────────────────────────────────  │
│  "Who on my team is at risk but hasn't spoken up?"        │
│                                                             │
│  [Who knows PostgreSQL?] [Who is at risk?] [Who works late?]│
│                                                             │
│  [  Ask Sentinel  ]                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 📊 AI Summary                                         │  │
│  │ Found 2 team members matching your query...          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Results (2):                              [Ranked]        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👤 Alex Chen                        [ELEVATED risk] │  │
│  │   • Late nights increasing (velocity +2.1)         │  │
│  │   • Response rate dropped 40%                       │  │
│  │   💡 Suggested: Schedule check-in                    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Sample Queries

Users can ask things like:

- **Risk Queries**:
  - "Who on my team is at risk?"
  - "Which engineers are burning out?"
  - "Show me critical risk employees"

- **Talent Queries**:
  - "Who are the hidden gems?"
  - "Who knows PostgreSQL?"
  - "Find people with high betweenness"

- **Team Queries**:
  - "Which team members might leave?"
  - "Who are the key connectors?"
  - "Show high-impact, low-risk employees"

---

## Real-World Scenarios

### Scenario 1: The Skills Search

**User**: Engineering Manager
**Query**: "Who knows PostgreSQL and isn't overwhelmed?"

**Process**:
1. User types query
2. AI detects "skill" + "risk" intent
3. Queries centrality table for relevant skills
4. Filters by risk_level = LOW
5. Returns ranked results

**Result**:
> "Found 3 engineers with PostgreSQL expertise and low burnout risk:
> - Sarah Chen (best fit - high betweenness, key connector)
> - Mike Johnson (senior, steady performer)
> - Lisa Wang (rising talent)"

### Scenario 2: The Risk Hunter

**User**: HR Partner
**Query**: "Which employees might leave?"

**Process**:
1. User types query
2. AI detects "attrition" intent
3. Queries risk_history for velocity trending up
4. Filters by belongingness < 0.3
5. Returns results sorted by flight risk

**Result**:
> "3 employees showing early flight signals:
> - Alex Chen: Velocity increased 300% in 2 weeks
> - Jordan Park: Social interactions dropped 60%
> - Taylor Smith: No PTO taken in 90 days"

### Scenario 3: The Team Builder

**User**: Engineering Manager
**Query**: "I need to form a new squad - who should I include?"

**Process**:
1. User types query
2. AI detects "team building" intent
3. Queries for:
   - High betweenness (connectors)
   - Low risk (sustainable)
   - Diverse skills
4. Returns optimized team composition

**Result**:
> "Recommended squad composition:
> - 1 Connector (Sarah Chen) - bridges silos
> - 1 Unblocker (Mike Johnson) - keeps things moving
> - 1 Specialist (Lisa Wang) - deep expertise
> - 1 Steady (Jordan Park) - reliable baseline"

---

## Files Created

### Backend
1. **`backend/app/api/v1/endpoints/ai.py`** (Modified)
   - Added `POST /ai/query` endpoint
   - Added `parse_query_intent()` function
   - Added `execute_semantic_query()` function
   - Added `apply_role_filter()` function

### Frontend
1. **`frontend/components/ai/AskSentinel.tsx`** (New)
   - Search input with sample suggestions
   - Results display with risk badges
   - AI summary card with gradient styling
   - Loading and error states
   - Animated transitions

2. **`frontend/components/ai/AIAssistant.tsx`** (New)
   - Full chat interface with conversation UI
   - Message bubbles with markdown rendering
   - Sources and reasoning display
   - Quick actions for agenda generation

3. **`frontend/lib/api.ts`** (Modified)
   - Added `semanticQuery(query)` function

---

## Key Design Decisions

### 1. Why Not Use Vector Search (RAG)?

Traditional semantic search uses embeddings:
```
Query → Embed → Vector DB → Top K → Results
```

**We chose rule-based + LLM** because:
- Our data is structured (SQL tables), not documents
- Intent matters more than semantic similarity
- "At risk" has specific meaning (velocity > 2.5)
- Faster and more accurate for structured queries

### 2. Why Combine Rule-Based + LLM?

| Component | Approach | Why |
|-----------|----------|-----|
| Intent detection | Rules | Precise, deterministic |
| Query execution | SQL | Accurate filtering |
| Response generation | LLM | Natural language |

**Hybrid wins**: Rules ensure accuracy, LLM adds polish.

### 3. Why Pseudonymize Results?

Even managers shouldn't see real names unless:
- Employee has consented
- It's a critical emergency

The UI shows "User A", "User B" - preserving privacy while enabling action.

---

## Testing the Query Engine

### Manual Test

```bash
# Test query endpoint
curl -X POST http://localhost:8000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Who is at risk?", "user_role": "manager"}'
```

### Expected Response

```json
{
  "query": "Who is at risk?",
  "response": "Found 2 team members at elevated or critical risk...",
  "results": [
    {
      "user_hash": "...",
      "pseudonym": "User A",
      "risk_level": "ELEVATED"
    }
  ]
}
```

### Testing Sample Queries

| Query | Expected Intent |
|-------|-----------------|
| "Who knows Python?" | skill_query |
| "At risk employees" | risk_query |
| "Hidden gems" | talent_query |
| "Might leave" | attrition_query |

---

## What's Next: Phase 3

Now that users can query, let's make reports **write themselves**:

> "Your risk increased because you worked 3 late nights after sprint end"
> "Team Beta is showing early contagion signals"

**Phase 3: Narrative Reports** - Auto-generated insights that explain the "why" behind every number.

---

## For Developers

### Adding New Query Types

1. Add intent pattern in `parse_query_intent()`:
```python
elif "flight" in query or "leave" in query:
    return "attrition_query"
```

2. Add query logic in `execute_semantic_query()`:
```python
if intent == "attrition_query":
    # Query for velocity trending up + low belongingness
    results = query_attrition_risk(...)
```

3. Update LLM prompt in `build_query_response_prompt()`

### Configuration

No extra config needed - uses existing LLM service.

---

## The Bottom Line

Phase 2 transforms Sentinel from a **queryable database** into a **conversational interface**.

- Anyone can ask questions in plain English
- Results are privacy-filtered by role
- Responses are natural, not tabular
- The system learns common query patterns

**From filters to questions. From tables to conversation.**

---

*Phase 2 Complete. Onward to Phase 3! 🚀*
