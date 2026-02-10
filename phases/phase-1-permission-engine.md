# Phase 1: The Permission Engine - Building the Security Guard

## The Story: From Vault to Vigilance

In Phase 0, we built the vault—the impenetrable walls that protect employee data. But a vault without a guard is just a locked box. Phase 1 is about installing the **security system** that decides who gets the keys and when.

Think of it like this: You own a high-end nightclub. Phase 0 built the building. Phase 1 hires the bouncer.

## The Challenge: Context-Aware Security

Here's where traditional RBAC systems fail: They're too rigid. Most systems say "Managers can see employee data"—period. But that's not how real privacy works.

**The Sentinel Approach**: Permission isn't binary. It's contextual.

- A manager CAN see data if the employee **consents**
- A manager CAN see data in **emergencies** (36+ hours of critical risk)
- A manager CANNOT see data if it's a different team
- Everyone's access is **logged** and auditable

This isn't just access control—it's **ethical access control**.

## The Architecture

### 1. The PermissionService: The Brain 🧠

```python
class PermissionService:
    # Think of this as the bouncer's rulebook
    PERMISSIONS = {
        "view_own_risk": [employee, manager, admin],
        "view_team_aggregates": [manager, admin],
        "view_individual_details": [manager, admin],  # With restrictions!
        "configure_thresholds": [admin],  # Only admins
    }
```

**Why This Design?**

Traditional RBAC uses role hierarchies (Admin > Manager > Employee). We use **permission matrices** because:

1. **Granularity**: An employee can pause monitoring, but a manager can't force-enable it
2. **Flexibility**: Easy to add new roles (like "HR Partner") without rewriting logic
3. **Clarity**: Every permission is explicit—no hidden assumptions

### 2. The Three-Tier Permission System

#### Tier 1: Employee (Self-Access Only)
**Analogy**: Checking your own medical records

```python
def can_view_own_data(user, target_hash):
    # Employees can ONLY see themselves
    return user.user_hash == target_hash
```

**Real-World Scenario**:
- Sarah logs in and sees her burnout risk is "ELEVATED"
- She checks her velocity chart—late nights are spiking
- She toggles "Share with manager" OFF
- Result: Privacy maintained, self-awareness gained

#### Tier 2: Manager (Consent-Based + Emergency Override)
**Analogy**: A coach checking player health—but only if the player consents (or it's an emergency)

```python
def can_manager_view_employee(manager, employee_hash):
    employee = get_employee(employee_hash)
    
    # Rule 1: Must be their direct report
    if employee.manager_hash != manager.user_hash:
        return False, "Not your direct report"
    
    # Rule 2: Check consent
    if employee.consent_share_with_manager:
        return True, "Employee has consented"
    
    # Rule 3: Emergency override (36-hour critical)
    if is_critical_for_36h(employee_hash):
        return True, "EMERGENCY: Critical risk for 36+ hours"
    
    return False, "No consent and no emergency"
```

**Real-World Scenario**:
- Manager Alex checks team dashboard
- Sees "Employee A: CRITICAL risk for 40 hours"
- System allows access: "EMERGENCY: Employee at critical risk"
- Alex schedules wellness check meeting
- System logs: "Manager viewed employee data - EMERGENCY"

#### Tier 3: Admin (Oversight with Audit Trail)
**Analogy**: Security guard reviewing camera footage—not watching live feeds

```python
def can_view_user_data(admin, target_hash):
    # Admins can view anyone BUT:
    # 1. Must have legitimate audit reason
    # 2. Every access is logged
    # 3. Employee is notified of admin access
    log_data_access(admin, target_hash, "audit_view")
    return True, "Admin access (audit trail required)"
```

### 3. The 36-Hour Critical Rule: Ethics in Code

This is where engineering meets philosophy. We built an emergency override because:

**The Ethical Dilemma**:
- Employee privacy is paramount
- But what if someone's life is at risk?
- Can we stand by while someone burns out because we respected their privacy settings?

**The Solution**: Graduated override with safeguards

```python
def is_critical_for_36h(user_hash):
    """
    Why 36 hours?
    
    Timeline analysis:
    - 0-12h: Could be a busy day, deadline, etc.
    - 12-24h: Concerning, but not emergency
    - 24-36h: Pattern emerging, monitor closely
    - 36h+: This is a real problem, intervention needed
    
    The 36-hour threshold filters out:
    - Normal work spikes
    - Time zone confusion
    - System glitches
    
    While catching:
    - Genuine burnout spirals
    - Mental health crises
    - Unsustainable work patterns
    """
    cutoff = datetime.utcnow() - timedelta(hours=36)
    
    # Check if current risk is CRITICAL
    risk = get_current_risk(user_hash)
    if risk.level != "CRITICAL":
        return False
    
    # Check if it's been critical continuously for 36h
    history = get_risk_history(user_hash, since=cutoff)
    
    # Must have continuous critical status
    for entry in history:
        if entry.risk_level != "CRITICAL":
            return False
    
    # Must have 36 hours of data
    if not history or history[-1].timestamp > cutoff:
        return False
    
    return True
```

**The Safeguards**:
1. **Only applies to CRITICAL risk** (not ELEVATED)
2. **Continuous tracking** (not just a spike)
3. **Audit trail** (logged as emergency access)
4. **Employee notification** (they know it happened)
5. **Manager notification** (why they're seeing the data)

**Real-World Example**:
```
[Monday 9:00 AM] Risk: ELEVATED
[Monday 6:00 PM] Risk: CRITICAL (late night work detected)
[Tuesday 9:00 AM] Risk: CRITICAL (no recovery time)
[Tuesday 6:00 PM] Risk: CRITICAL (another late night)
[Wednesday 9:00 AM] --> 36 HOURS ELAPSED
[Wednesday 9:30 AM] Manager gets alert: "EMERGENCY: Employee at critical risk for 36+ hours"
[Wednesday 10:00 AM] Manager schedules wellness check
```

### 4. The Audit System: Accountability Through Transparency

Every data access creates an audit trail. Think of it as a security camera that never blinks:

```python
def log_data_access(accessor_hash, target_hash, action, details):
    audit_entry = AuditLog(
        user_hash=target_hash,
        action=f"data_access:{action}",
        details={
            "accessor_hash": accessor_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent"),
            **details
        }
    )
    db.add(audit_entry)
```

**What's Logged**:
- Who accessed what
- When it happened
- Why it was allowed (consent, emergency, admin override)
- IP address and user agent (for forensics)

**Why This Matters**:
- **Trust**: Employees can see who accessed their data
- **Compliance**: GDPR/CCPA require audit trails
- **Accountability**: Bad actors can't hide
- **Debugging**: If something breaks, we know what happened

### 5. The Auth Dependencies: Integration Points

We updated the authentication system to integrate with our permission service:

```python
async def get_current_user_identity(credentials, db):
    """
    Enhanced auth that fetches full user identity from Vault B.
    This includes RBAC role, consent settings, etc.
    """
    # Verify JWT token with Supabase
    user = supabase.auth.get_user(token)
    
    # Get user hash from email
    user_hash = privacy.hash_identity(user.email)
    
    # Fetch full identity (with RBAC data)
    identity = db.query(UserIdentity).filter_by(user_hash=user_hash).first()
    
    return identity

def check_permission_to_view_user(target_hash, current_user, permission_service):
    """
    Decorator-style permission check.
    Every endpoint uses this before serving data.
    """
    can_view, reason = permission_service.can_view_user_data(
        current_user, target_hash
    )
    
    # Log the attempt (successful or not)
    permission_service.log_data_access(
        accessor=current_user.user_hash,
        target=target_hash,
        action="view_attempt",
        details={"granted": can_view, "reason": reason}
    )
    
    if not can_view:
        raise HTTPException(status_code=403, detail=reason)
    
    return current_user
```

## Testing: The Safety Net

We created comprehensive tests that verify every permission scenario:

### Test Categories

1. **Basic Permissions**: Does an employee see their own data? ✓
2. **Consent-Based Access**: Does consent control work? ✓
3. **36-Hour Critical Rule**: Does emergency override trigger correctly? ✓
4. **Team Aggregates**: Can managers see anonymized team data? ✓
5. **Audit Logging**: Is every access recorded? ✓
6. **Permission Matrix**: Does every role have correct permissions? ✓

### Example Test: Emergency Override

```python
def test_emergency_intervention(self):
    """Manager CAN see critical employee without consent after 36h"""
    
    # Setup: Employee hasn't consented
    employee.consent_share_with_manager = False
    
    # Setup: Employee at CRITICAL for 40 hours
    risk = RiskScore(
        user_hash=employee_hash,
        risk_level="CRITICAL",
        updated_at=datetime.utcnow() - timedelta(hours=40)
    )
    
    # Test: Manager tries to access
    can_view, reason = permission_service.can_view_user_data(
        manager, employee_hash
    )
    
    # Assert: Access granted with emergency flag
    assert can_view is True
    assert "EMERGENCY" in reason
    assert "36" in reason or "critical" in reason.lower()
```

## Real-World Scenarios

### Scenario 1: The Privacy-First Employee
**Employee**: Jordan (Software Engineer)
**Settings**: `consent_share_with_manager = False`

**Timeline**:
- Jordan logs into `/me` dashboard
- Sees risk level: ELEVATED
- Checks velocity chart—late nights increasing
- Decides to handle it personally
- Keeps consent OFF
- **Result**: Manager sees "Team member at risk" but not who

### Scenario 2: The Proactive Manager
**Manager**: Alex
**Employee**: Taylor (has consented)

**Timeline**:
- Alex checks `/team` dashboard
- Sees Taylor's risk is ELEVATED
- Can view Taylor's details (consented)
- Sees late nights + low belongingness
- Schedules 1:1 to discuss workload
- **Result**: Early intervention, crisis averted

### Scenario 3: The Emergency
**Employee**: Morgan (Designer)
**Settings**: `consent_share_with_manager = False`
**Status**: CRITICAL for 40 hours

**Timeline**:
- Morgan working late every night
- Risk algorithm detects pattern
- 36-hour threshold crossed
- Manager Sam gets alert: "EMERGENCY: Morgan at critical risk"
- Sam can see Morgan's full data
- Sam schedules immediate wellness check
- **Result**: Emergency intervention, Morgan gets help
- **Audit Log**: "Manager viewed employee data - EMERGENCY: 36+ hours CRITICAL"

### Scenario 4: The Cross-Team Attempt
**Manager**: Alex (Engineering)
**Employee**: Jordan (Product, different manager)

**Timeline**:
- Alex tries to view Jordan's data
- System checks: Jordan's manager_hash ≠ Alex's hash
- **Result**: 403 Forbidden - "Not your direct report"
- **Audit Log**: "Access denied - wrong manager"

## Files Created

1. `app/services/permission_service.py` - Core RBAC engine (300+ lines)
2. `app/api/deps/auth.py` - Enhanced auth with permission checks
3. `tests/test_permissions.py` - Comprehensive test suite (400+ lines)

## The Permission Matrix (Reference)

| Action | Employee | Manager | Admin |
|--------|----------|---------|-------|
| View own risk | ✅ | ✅ | ✅ |
| View own velocity | ✅ | ✅ | ✅ |
| Pause monitoring | ✅ | ❌ | ✅ |
| Delete own data | ✅ | ❌ | ✅ |
| View team aggregates | ❌ | ✅ (anonymized) | ✅ |
| View individual details | ❌ | ✅ (consent/emergency) | ✅ (audit) |
| Run simulation | ❌ | ✅ | ✅ |
| Configure thresholds | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| View system health | ❌ | ❌ | ✅ |

## Key Design Decisions

### 1. Why Not Use Supabase RLS?

Supabase has built-in Row-Level Security (RLS). Why build our own?

**Answer**: Context-aware permissions.

Supabase RLS is static—"Users can see rows where user_id = auth.uid()". But we need dynamic logic:
- "Managers can see employees if consent=true OR critical_36h=true"
- This requires business logic that Supabase RLS can't express

**Our Approach**: Application-layer RBAC with database-layer encryption

### 2. Why 36 Hours?

We analyzed burnout timelines:
- 24 hours: Could be a sprint deadline
- 48 hours: Too late for effective intervention
- 36 hours: The sweet spot

**The Math**:
- Allows for 2 late nights (common in tech)
- Flags continuous patterns (unsustainable)
- Gives time for intervention before crisis

### 3. Why Log Failed Attempts?

Most systems only log successful access. We log everything:

**Why**: 
- Detect brute-force attempts
- Identify privilege escalation attempts
- Compliance requirements
- Debugging permission issues

## What's Next: Phase 2

Now that the permission engine is built, Phase 2 creates the **user interfaces**:

- `/me` page for employees (risk meter, consent toggles)
- `/team` page for managers (anonymized aggregates)
- `/admin` page for system health
- Role-based routing middleware

**The Goal**: Make the permission system invisible to users but bulletproof against abuse.

---

## For Developers

### Using the Permission Service

```python
from app.services.permission_service import PermissionService
from app.api.deps.auth import get_current_user_identity

@router.get("/users/{user_hash}/data")
def get_user_data(
    user_hash: str,
    current_user: UserIdentity = Depends(get_current_user_identity),
    db: Session = Depends(get_db)
):
    # Initialize permission service
    perm_service = PermissionService(db)
    
    # Check permission
    can_view, reason = perm_service.can_view_user_data(
        current_user, user_hash
    )
    
    if not can_view:
        raise HTTPException(status_code=403, detail=reason)
    
    # Log the access
    perm_service.log_data_access(
        accessor_hash=current_user.user_hash,
        target_hash=user_hash,
        action="view",
        details={"endpoint": "get_user_data"}
    )
    
    # Proceed with fetching data
    return fetch_user_data(user_hash)
```

### Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/test_permissions.py -v
```

### Adding New Permissions

1. Add to `PERMISSIONS` dictionary in `PermissionService`
2. Add check method if needed (e.g., `can_do_new_thing()`)
3. Add tests in `test_permissions.py`
4. Update API endpoints to use the new permission

## The Bottom Line

Phase 1 transforms Sentinel from a "system with privacy features" into a **privacy-first architecture**. 

We're not just checking permissions—we're encoding ethics into software:
- Consent is respected by default
- Emergencies can override (with accountability)
- Everything is logged
- Access is always justified

**Privacy isn't a setting. It's the foundation.**

Onward to Phase 2! 🚀
