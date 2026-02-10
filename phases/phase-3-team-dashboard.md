# Phase 3: The Team Dashboard - Privacy-Preserving Management

## The Story: Signal Without Surveillance

Imagine you're a coach. You want to know if your players are struggling, but you don't want to read their diaries. You need signal—insights that help you support your team—without surveillance.

That's what Phase 3 builds: a manager dashboard that respects privacy while enabling care.

## The Challenge: Anonymized Intelligence

Most analytics tools give you names, faces, and granular details. But that creates a surveillance culture. We needed something different:

**The Sentinel Approach**: Signal without identification.

- Managers see team trends
- Managers see "User A is at risk" not "Jordan is burning out"
- Only with consent or emergency can they see individual details

This isn't just privacy—it's **psychological safety**.

## The Anonymization Architecture

### The Pseudonym System

```python
def anonymize_user_hash(user_hash: str, index: int) -> str:
    """
    Convert hash to pseudonym for anonymized views.
    abc123 with index 0 -> User A
    def456 with index 1 -> User B
    """
    return f"User {chr(65 + index)}"  # A, B, C, ...
```

**Why This Works**:
1. **Consistent within session**: User A is always the same person during one view
2. **No reverse lookup**: Can't go from "User A" back to real identity
3. **Human readable**: "User A" is better than "hash_abc123"
4. **Scalable**: A-Z gives us 26 users, AA-ZZ gives us 676

### The De-Anonymization Rules

Managers can see individual details ONLY when:

1. **Consent**: Employee has toggled `consent_share_with_manager = True`
2. **Emergency**: Employee at CRITICAL risk for 36+ hours

```python
def can_manager_view_employee(manager, employee_hash):
    employee = get_employee(employee_hash)
    
    # Rule 1: Must be direct report
    if employee.manager_hash != manager.user_hash:
        return False, "Not your direct report"
    
    # Rule 2: Check consent
    if employee.consent_share_with_manager:
        return True, "Employee has consented"
    
    # Rule 3: Emergency override
    if is_critical_for_36h(employee_hash):
        return True, "EMERGENCY: Critical risk for 36+ hours"
    
    return False, "No consent and no emergency"
```

**The Ethics**: Emergency override is like calling 911—you don't need permission to save a life, but you'd better have a damn good reason.

## Technical Implementation

### The `/team` API Endpoints

#### 1. GET /team - Team Overview (Anonymized)

```python
@router.get("/team")
def get_my_team_dashboard(current_user, db):
    team_members = get_team_members(db, current_user.user_hash)
    
    # Build anonymized member list
    anonymized_members = []
    for idx, member in enumerate(team_members):
        pseudonym = anonymize_user_hash(member.user_hash, idx)
        
        anonymized_members.append({
            "pseudonym": pseudonym,
            "is_identified": member.consent_share_with_manager,
            "real_hash": member.user_hash if member.consent_share_with_manager else None,
            "risk_level": get_risk_level(member.user_hash),
            "has_consent": member.consent_share_with_manager
        })
    
    return {
        "team": {
            "member_count": len(team_members),
            "members": anonymized_members
        },
        "metrics": {
            "at_risk_count": count_at_risk(team_members),
            "consent_rate": calculate_consent_rate(team_members)
        }
    }
```

**What Managers See**:
```json
{
  "team": {
    "member_count": 5,
    "members": [
      {
        "pseudonym": "User A",
        "is_identified": true,  // Consented!
        "real_hash": "abc123...",
        "risk_level": "ELEVATED",
        "has_consent": true
      },
      {
        "pseudonym": "User B",
        "is_identified": false,  // Anonymous
        "real_hash": null,
        "risk_level": "CRITICAL",
        "has_consent": false
      }
    ]
  }
}
```

**The Experience**:
- Manager sees "User B is at CRITICAL risk"
- Manager knows someone on their team needs help
- Manager doesn't know who (yet)
- Manager can reach out to the whole team: "Hey everyone, let's check in"

#### 2. GET /team/member/{hash} - Individual Details

This is where the consent/emergency check happens:

```python
@router.get("/team/member/{user_hash}")
def get_team_member_details(user_hash, current_user, db):
    # Check permissions
    can_view, reason = permission_service.can_manager_view_employee(
        current_user, user_hash
    )
    
    # Log the access
    log_data_access(current_user.user_hash, user_hash, "view_team_member")
    
    if not can_view:
        return {
            "access": "denied",
            "reason": reason,
            "employee": {
                "pseudonym": "User ?",
                "message": "This employee has not consented"
            }
        }
    
    # Access granted - return full details
    return {
        "access": "granted",
        "reason": reason,
        "employee": {
            "user_hash": user_hash,
            "is_identified": True,
            "consent": employee.consent_share_with_manager
        },
        "risk": get_risk_details(user_hash),
        "history": get_risk_history(user_hash),
        "recent_events": get_recent_events(user_hash)
    }
```

**Two Possible Responses**:

**Denied (No Consent)**:
```json
{
  "access": "denied",
  "reason": "Employee has not consented to share detailed data",
  "employee": {
    "pseudonym": "User ?",
    "is_identified": false,
    "message": "Limited to anonymized summary"
  },
  "suggestion": "Consider having a conversation about wellbeing support"
}
```

**Granted (Consented)**:
```json
{
  "access": "granted",
  "reason": "Employee has consented",
  "employee": {
    "user_hash": "abc123...",
    "is_identified": true,
    "consent": true
  },
  "risk": {
    "current_level": "ELEVATED",
    "velocity": 1.5,
    "confidence": 0.85
  },
  "history": [...],
  "recent_events": [...]
}
```

#### 3. GET /team/analytics - Team Trends

Aggregated metrics without individual identification:

```python
@router.get("/team/analytics")
def get_team_analytics(days: int = 30, current_user, db):
    team_members = get_team_members(db, current_user.user_hash)
    
    # Calculate team health score
    health_score = calculate_health_score(team_members)
    
    # Get velocity trends (anonymized)
    trends = get_velocity_trends(team_members, days)
    
    return {
        "health_score": health_score,  // 0-100
        "current_metrics": {
            "avg_velocity": 1.5,
            "critical_count": 1,
            "elevated_count": 2,
            "healthy_count": 2
        },
        "trends": trends  // Daily averages, no individual data
    }
```

**What This Enables**:
- Manager sees "Team velocity is trending up"
- Manager sees "2 members at elevated risk"
- Manager CANNOT see "Jordan and Taylor are at risk"
- Manager can take team-level action: "Let's reduce sprint scope"

#### 4. GET /team/network - Communication Graph (Anonymized)

Shows collaboration patterns without names:

```python
@router.get("/team/network")
def get_team_network(current_user, db):
    edges = get_graph_edges(team_members)
    
    nodes = []
    for idx, member in enumerate(team_members):
        nodes.append({
            "id": anonymize_user_hash(member.user_hash, idx),
            "risk_level": get_risk_level(member.user_hash),
            "is_identified": member.consent_share_with_manager
        })
    
    return {
        "nodes": nodes,
        "edges": anonymized_edges
    }
```

**What Managers See**:
- Network graph showing "User A collaborates frequently with User B"
- Can identify isolated team members ("User C has few connections")
- Can identify key connectors ("User D bridges two groups")
- Without knowing who A, B, C, D actually are (unless consented)

## Frontend: The `/team` Page

### Design Philosophy: Transparency About Transparency

The UI makes it crystal clear what's happening:

1. **Anonymous Members**: Eye-off icon, "Anonymous" label
2. **Identified Members**: User icon, "Identified" label
3. **Consent Status**: Clear indication of who has/hasn't consented
4. **Access Denied**: Friendly message explaining why details are hidden

### The Three Tabs

#### Tab 1: Overview
- Team size, health score, at-risk count
- Risk distribution (bar chart)
- Consent rate
- **Privacy notice banner**: "Individual team members are shown as pseudonyms..."

#### Tab 2: Members
- Grid of team member cards
- Each card shows:
  - Pseudonym (User A, User B, etc.)
  - Risk level (color-coded badge)
  - Consent status
  - Click to view details (if permitted)
- **Member Detail Modal**:
  - If access granted: Full metrics, history, events
  - If access denied: Friendly explanation, suggestion to have a conversation

#### Tab 3: Analytics
- Team velocity trend (line chart)
- Health score over time
- Risk distribution history
- All data aggregated—no individual curves

## Real-World Scenarios

### Scenario 1: The Careful Manager
**Manager**: Alex (Engineering Manager)
**Team**: 5 engineers

**Monday Morning**:
1. Alex checks `/team` dashboard
2. Sees: "User B at CRITICAL risk" (not identified)
3. Also sees: "2/5 team members have consented"
4. Alex schedules team check-in meeting
5. During meeting, offers support to entire team
6. **Result**: Support offered without singling anyone out

**Wednesday**:
1. Alex notices User B is still at CRITICAL
2. 36-hour threshold crossed
3. System de-anonymizes: "User B is Jordan"
4. Alex sees Jordan's details: velocity 2.8, no weekend recovery
5. Alex reaches out directly to Jordan
6. **Result**: Early intervention prevents burnout

### Scenario 2: The Trusted Manager
**Manager**: Sam (Product Manager)
**Team**: 3 designers

**The Situation**:
- All 3 designers have consented to share data
- Sam can see everyone identified

**Tuesday**:
1. Sam sees Taylor's risk is ELEVATED
2. Checks details: velocity increasing, belongingness decreasing
3. Sam schedules 1:1 with Taylor
4. Discovers Taylor feels isolated on new project
5. Adjusts team assignments
6. **Result**: Crisis averted through proactive management

**Why This Works**: Trust is earned, not demanded. Consent-based sharing creates mutual respect.

### Scenario 3: The Privacy-First Employee
**Employee**: Jordan (Backend Engineer)
**Settings**: `consent_share_with_manager = False`

**The Timeline**:
- Week 1-2: Jordan works normal hours, risk LOW
- Week 3: Deadline approaches, late nights start
- Week 4: Risk becomes ELEVATED, then CRITICAL
- Manager sees: "User C at CRITICAL risk" (Jordan is anonymous)

**The Emergency**:
- Hour 36: System crosses threshold
- Manager sees: "EMERGENCY: User C at critical risk for 36+ hours"
- Manager sees Jordan's real identity and details
- Manager schedules immediate wellness check
- **Result**: Intervention happens, but only after 36 hours of sustained risk

**The Safeguards**:
- Jordan was anonymous for 36 hours (privacy respected)
- After 36 hours, safety takes priority
- Full audit trail: "Access granted - EMERGENCY: 36+ hours CRITICAL"
- Jordan is notified of the access

### Scenario 4: The Cross-Team Manager
**Manager**: Alex (Engineering)
**Attempt**: Tries to view Jordan (Product team, different manager)

**What Happens**:
1. Alex tries to access `/team/member/jordan_hash`
2. System checks: Jordan's manager_hash ≠ Alex's hash
3. **Result**: 403 Forbidden - "Not your direct report"
4. **Audit Log**: "Access denied - wrong manager"

**Why This Matters**: Even if Alex is senior, they can't access data outside their team. Hierarchy ≠ access.

## Security Measures

### 1. Role-Based Access
Only managers and admins can access `/team` endpoints:

```python
@router.get("/team")
def get_my_team_dashboard(
    current_user: UserIdentity = Depends(require_role("manager", "admin"))
):
    # Only managers/admins get here
```

### 2. Team Verification
Every request verifies the employee actually reports to this manager:

```python
if employee.manager_hash != current_user.user_hash:
    raise HTTPException(403, "Not your direct report")
```

### 3. Audit Everything
Every access attempt is logged:

```python
log_data_access(
    accessor_hash=manager.user_hash,
    target_hash=employee_hash,
    action="view_team_member",
    details={
        "granted": can_view,
        "reason": reason
    }
)
```

## Files Created

### Backend
1. `app/api/v1/endpoints/team.py` - All /team endpoints (400+ lines)
2. `tests/test_team_endpoints.py` - Comprehensive test suite (250+ lines)
3. `app/api/v1/api.py` - Updated with /team router

### Frontend
1. `app/team/page.tsx` - Manager dashboard (500+ lines)

## API Endpoints Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/team` | GET | Team overview (anonymized) | Manager/Admin |
| `/team/member/{hash}` | GET | Individual details (consent/emergency) | Manager/Admin |
| `/team/analytics` | GET | Team trends (aggregated) | Manager/Admin |
| `/team/network` | GET | Communication graph (anonymized) | Manager/Admin |
| `/team/send-nudge/{hash}` | POST | Send wellness message | Manager/Admin |

## The Bottom Line

Phase 3 creates a **new paradigm**: Manager insights without surveillance.

Traditional tools say: "Managers must see everything to be effective."

Sentinel says: "Managers can lead effectively with signal, not surveillance."

This isn't just about privacy—it's about **trust**. And trust is the foundation of high-performing teams.

Onward to Phase 4! 🚀

---

## Quick Reference

### Testing the /team Endpoints

```bash
# Get team overview
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/team

# Get member details (will check consent)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/team/member/USER_HASH

# Get team analytics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/team/analytics?days=30"

# Get team network graph
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/team/network
```

### The Anonymization Flow

```
Real Hash → Pseudonym → Display
abc123   →   User A   → Manager sees "User A"
def456   →   User B   → Manager sees "User B"

With Consent:
Real Hash → Pseudonym → Display
abc123   →   User A   → Manager sees "User A (Jordan)"
```
