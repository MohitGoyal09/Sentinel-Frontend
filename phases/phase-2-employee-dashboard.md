# Phase 2: The Employee Dashboard - Your Data, Your Control

## The Story: Empowerment Through Transparency

Remember the first time you checked your credit score? That mix of anxiety and empowerment? That's what we're building—but for workplace wellbeing.

Phase 1 gave us the security guard (permissions). Phase 2 gives employees the **keys to their own house**. This isn't just a dashboard; it's a statement: "Your data belongs to you."

## The Philosophy: Radical Transparency

Most employee monitoring tools hide behind corporate walls. Managers see everything; employees see nothing. We're flipping that script.

**The Sentinel Promise**: 
- You see everything we see
- You control who else sees it
- You can pause or delete anytime
- You know who accessed your data and when

This isn't just good ethics—it's good business. Employees who trust the system actually use it.

## Technical Implementation

### Backend: The `/me` API

We created 7 endpoints that form the backbone of employee self-service:

```python
GET    /me              # Full profile + risk data
GET    /me/risk-history # Historical risk scores
PUT    /me/consent     # Update consent settings
POST   /me/pause-monitoring     # Pause for X hours
POST   /me/resume-monitoring    # Resume immediately
DELETE /me/data        # GDPR right to be forgotten
GET    /me/audit-trail # See who accessed your data
```

**Why These Endpoints?**

1. **GET /me**: The main dashboard data—everything an employee needs to see their current state
2. **GET /me/risk-history**: Raw data for transparency—no black box algorithms here
3. **PUT /me/consent**: Granular control over sharing
4. **POST /me/pause-monitoring**: The "Do Not Disturb" button—mental health first
5. **POST /me/resume-monitoring**: Early resumption for proactive employees
6. **DELETE /me/data**: True GDPR compliance—not just a checkbox
7. **GET /me/audit-trail**: Trust through transparency—see every access

### The Consent Flow

```python
# Before: Manager wants to see employee data
# Check: Does employee consent?
if not employee.consent_share_with_manager:
    # Check emergency override
    if not is_critical_for_36h(employee.user_hash):
        return 403, "Access denied - no consent"
```

**The User Experience**:
1. Employee logs into `/me`
2. Sees "Share with Manager" toggle (default: OFF)
3. Decides to turn it ON
4. Manager can now see individual details
5. System logs: "Consent granted by employee"

This isn't just permission—it's **informed consent**.

### The Pause Feature

Remember when Slack added the "pause notifications" feature? Suddenly people could actually take vacations. We're bringing that to wellbeing monitoring.

```python
POST /me/pause-monitoring?hours=24

Response:
{
  "message": "Monitoring paused for 24 hours",
  "paused_until": "2026-02-11T12:00:00Z",
  "will_resume": "2026-02-11T12:00:00Z"
}
```

**Use Cases**:
- **Vacation**: "I'm off the grid for a week"
- **Mental health day**: "I need to unplug"
- **Personal crisis**: "Family emergency, can't deal with tracking"
- **Just because**: "I don't want to be monitored today"

**The Limits**:
- Max 7 days (prevents indefinite opt-out)
- Audit logged (transparency)
- Can resume early (flexibility)

### The Nuclear Option: Delete All Data

GDPR Article 17: "Right to erasure ('right to be forgotten')"

We didn't just implement this—we made it **easy**:

```python
DELETE /me/data?confirm=true

# What gets deleted:
- User identity record (Vault B)
- Risk scores
- Risk history
- Audit logs
- All personal identifiers

# What stays (anonymized):
- Graph edges (relationships without names)
- Team aggregates (your data removed from averages)
```

**The Confirmation Dialog**:
1. Click "Delete All My Data"
2. Type "DELETE" to confirm (prevents accidents)
3. All data permanently erased
4. User signed out automatically
5. Account no longer exists

This isn't a marketing feature—it's a **fundamental right**.

## Frontend: The `/me` Page

### Design Principles

1. **Clarity First**: No corporate jargon. "Velocity" becomes "Work intensity trend."
2. **Action-Oriented**: Every metric has a "What can I do?" section
3. **Privacy Controls Front and Center**: Not hidden in settings
4. **Transparency**: Audit trail visible, not buried in logs

### The Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  My Wellbeing                    [Role: Employee]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Risk Level   │  │ Privacy      │  │ Monitoring│ │
│  │              │  │ Controls     │  │ Controls  │ │
│  │ ELEVATED     │  │              │  │           │ │
│  │              │  │ [✓] Share    │  │ Active    │ │
│  │ Velocity: 1.5│  │     with     │  │           │ │
│  │ Confidence:  │  │     Manager  │  │ [8h] [24h]│ │
│  │     85%      │  │              │  │ [72h]     │ │
│  └──────────────┘  │ [✓] Team     │  │           │ │
│                    │     Analytics│  │ [Resume]  │ │
│                    └──────────────┘  └──────────┘ │
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ Data Access History  │  │ Delete My Data   │   │
│  │                      │  │                  │   │
│  │ • Manager viewed     │  │ [DANGER ZONE]    │   │
│  │   your data          │  │                  │   │
│  │   (2 days ago)       │  │ Permanently      │   │
│  │   Reason: Consent    │  │ delete all       │   │
│  │                      │  │ personal data    │   │
│  │ • You updated        │  │                  │   │
│  │   consent            │  │ [Delete...]      │   │
│  │   (5 days ago)       │  │                  │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Key Features

#### 1. Risk Score Card
- Color-coded (Green/Amber/Red)
- Shows velocity, confidence, belongingness
- Updates in real-time
- Links to "What does this mean?" help

#### 2. Privacy Controls
- Toggle switches with clear labels
- Immediate feedback on changes
- Audit log entry created automatically
- Footer reminder: "No data shared without consent"

#### 3. Monitoring Controls
- Quick pause buttons (8h, 24h, 72h)
- Visual status indicator
- Resume button when paused
- Explanation of what pausing does

#### 4. Audit Trail
- Scrollable history
- Icons for different action types
- Timestamps in local time
- Filterable by action type

#### 5. Delete Data Section
- Red border (danger zone)
- Warning alert
- Confirmation dialog
- "Type DELETE to confirm" safeguard

## Real-World Scenarios

### Scenario 1: The Privacy-First Employee
**Profile**: Jordan, Backend Engineer, values privacy

**Journey**:
1. Logs into `/me` for the first time
2. Sees risk level: ELEVATED
3. Checks velocity chart—late nights spiking
4. Decides to handle it personally
5. **Toggles "Share with Manager" OFF** (already off by default)
6. Schedules vacation, **pauses monitoring for 72h**
7. **Result**: Jordan addresses burnout privately, manager only sees "Team member at risk" without identification

**Why This Matters**: Jordan retains autonomy over their personal health data while still benefiting from the insights.

### Scenario 2: The Proactive Sharer
**Profile**: Taylor, Frontend Engineer, trusts their manager

**Journey**:
1. Logs into `/me`, sees risk: ELEVATED
2. Notices declining belongingness score
3. **Turns ON "Share with Manager"**
4. Manager Alex sees Taylor's details
5. Alex schedules 1:1, discovers Taylor feels isolated on new team
6. Alex adjusts team assignments
7. **Result**: Early intervention prevents crisis

**Why This Matters**: Consent-based sharing enables proactive support without surveillance.

### Scenario 3: The Transparency Check
**Profile**: Morgan, Designer, curious about data access

**Journey**:
1. Logs into `/me`
2. Clicks "Data Access History"
3. Sees: "Manager viewed your data (3 days ago)"
4. Clicks for details: "Reason: Consent"
5. Remembers they turned on sharing last week
6. **Result**: Morgan trusts the system because they can verify access

**Why This Matters**: Transparency builds trust. Employees who trust the system engage with it.

### Scenario 4: The Fresh Start
**Profile**: Casey, leaving the company

**Journey**:
1. Decides to leave company
2. Logs into `/me`
3. Clicks "Delete My Data"
4. Reads warning: "This is irreversible"
5. Types "DELETE" to confirm
6. All data permanently erased
7. Auto-logged out
8. **Result**: Casey leaves with peace of mind—no data retained

**Why This Matters**: True data ownership includes the right to deletion. No retention games.

## Security Considerations

### 1. Endpoint Authorization
Every `/me` endpoint requires authentication and verifies the user can only access their own data:

```python
async def get_my_profile(
    current_user: UserIdentity = Depends(get_current_user_identity)
):
    # current_user is automatically populated from JWT token
    # User can ONLY see their own data—no user_hash parameter needed
```

### 2. Audit Everything
Every action creates an audit trail:
- Consent changes
- Monitoring pause/resume
- Data deletion (yes, we log that too)
- Data access (who viewed what)

### 3. Rate Limiting
Sensitive endpoints have rate limits:
- Delete data: 1 attempt per hour (prevents brute force)
- Consent changes: 10 per minute (prevents spam)
- Pause monitoring: unlimited (employee's right)

## Files Created

### Backend
1. `app/api/v1/endpoints/me.py` - All `/me` endpoints (300+ lines)
2. `tests/test_me_endpoints.py` - Comprehensive test suite (200+ lines)
3. `app/api/v1/api.py` - Updated to include /me router

### Frontend
1. `app/me/page.tsx` - Employee dashboard (400+ lines)

## API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/me` | GET | Get user profile and wellness data | ✅ |
| `/me/risk-history` | GET | Get historical risk scores | ✅ |
| `/me/consent` | PUT | Update consent settings | ✅ |
| `/me/pause-monitoring` | POST | Pause monitoring | ✅ |
| `/me/resume-monitoring` | POST | Resume monitoring | ✅ |
| `/me/data` | DELETE | Delete all data | ✅ |
| `/me/audit-trail` | GET | Get data access history | ✅ |

## Testing Strategy

### Backend Tests
- **Unit tests**: Each endpoint tested in isolation
- **Integration tests**: End-to-end consent flow
- **Security tests**: Verify users can't access others' data
- **Edge cases**: Invalid durations, missing data, etc.

### Frontend Tests
- Component rendering
- State management
- API integration
- Error handling
- Accessibility (keyboard navigation)

## What's Next: Phase 3

Phase 3 builds the **Manager View** (`/team`):
- Anonymized team aggregates
- Individual details (only with consent/emergency)
- Team health dashboard
- Network visualization (anonymized)

**The Goal**: Give managers the insights they need while respecting employee privacy choices.

---

## For Developers

### Testing the /me Endpoints

```bash
# Get your profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/me

# Update consent
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"consent_share_with_manager": true}' \
  http://localhost:8000/api/v1/me/consent

# Pause monitoring
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/me/pause-monitoring?hours=24"

# Delete all data (⚠️ IRREVERSIBLE)
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/me/data?confirm=true"
```

### Frontend Component Structure

```
/me/page.tsx
├── Header (user hash, role badge, back button)
├── Risk Score Card
│   ├── Risk level display
│   ├── Velocity, confidence, belongingness
│   └── Color-coded status
├── Privacy Controls Card
│   ├── Share with Manager toggle
│   ├── Team Analytics toggle
│   └── Privacy explanation
├── Monitoring Controls Card
│   ├── Status indicator
│   ├── Quick pause buttons (8h/24h/72h)
│   └── Resume button (when paused)
├── Audit Trail Card
│   ├── Scrollable history
│   ├── Action icons
│   └── Timestamps
└── Delete Data Card
    ├── Warning alert
    ├── Confirmation dialog
    └── Type DELETE safeguard
```

## The Bottom Line

Phase 2 transforms Sentinel from a monitoring tool into a **wellness partnership**. 

Employees aren't subjects—they're partners. They have:
- **Visibility**: See everything we see
- **Control**: Decide who else sees it
- **Agency**: Pause, resume, or delete
- **Transparency**: Know who accessed their data

This isn't just privacy-by-design. It's **empowerment-by-design**.

Onward to Phase 3! 🚀
