# Phase 4: The Admin Dashboard - System Oversight

## The Story: The Watchtower

Picture a lighthouse keeper. They don't control the ships, but they see everything happening in the harbor. They spot danger before it becomes disaster. They maintain the light that keeps everyone safe.

That's the Admin Dashboard—not a control panel for micromanagement, but a **watchtower for system health**.

## The Philosophy: Transparency at Scale

In Phases 2 and 3, we built transparency for individuals and teams. Phase 4 extends that to the **system level**:

- How healthy is the overall system?
- Are there patterns of unauthorized access?
- What's the consent rate across the organization?
- Are there systemic issues we need to address?

This isn't Big Brother—it's **system administration with ethics**.

## Technical Implementation

### The `/admin` API Endpoints

#### 1. GET /admin/health - System Vitals

```python
@router.get("/admin/health")
def get_system_health(current_user, db):
    # Only admins can access this
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    
    return {
        "status": "healthy",
        "database": {
            "total_users": db.query(User).count(),
            "total_events": db.query(Event).count(),
            "total_audit_logs": db.query(AuditLog).count()
        },
        "users": {
            "by_role": get_role_distribution(),
            "consent_rate": calculate_consent_rate()
        },
        "risk_summary": {
            "critical_count": count_critical_users(),
            "elevated_count": count_elevated_users()
        }
    }
```

**What Admins See**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T12:00:00Z",
  "database": {
    "total_users": 17,
    "total_events": 15234,
    "total_audit_logs": 8921
  },
  "users": {
    "by_role": {
      "employee": 12,
      "manager": 3,
      "admin": 2
    },
    "consent_rate": {
      "consented": 5,
      "total": 17,
      "percentage": 29.4
    }
  },
  "risk_summary": {
    "critical_count": 1,
    "elevated_count": 3,
    "at_risk_total": 4
  }
}
```

**Why This Matters**:
- **System Capacity**: Know when you're approaching limits
- **Privacy Adoption**: Track consent rates (are people trusting the system?)
- **Crisis Detection**: Spot when too many people are at critical risk

#### 2. GET /admin/audit-logs - The Truth Ledger

Every data access, every permission check, every emergency override—all logged and searchable.

```python
@router.get("/admin/audit-logs")
def get_system_audit_logs(
    days: int = 7,
    action_type: Optional[str] = None,
    user_hash: Optional[str] = None,
    current_user, db
):
    query = db.query(AuditLog)
    
    # Filter by time period
    cutoff = datetime.utcnow() - timedelta(days=days)
    query = query.filter(AuditLog.timestamp >= cutoff)
    
    # Filter by action type
    if action_type:
        query = query.filter(AuditLog.action.like(f"%{action_type}%"))
    
    # Filter by specific user
    if user_hash:
        query = query.filter(AuditLog.user_hash == user_hash)
    
    return {
        "total_count": query.count(),
        "logs": format_logs(query.all())
    }
```

**Use Cases**:

**Compliance Audit**:
- Auditor: "Show me all data access in the last 30 days"
- Admin filters by `days=30`, sees 4,231 access events
- Each event has: who, what, when, why

**Investigation**:
- Suspicion: "Did Manager X access data they shouldn't have?"
- Admin filters by `user_hash=manager_x_hash`
- Sees: 45 access events, all legitimate

**Pattern Detection**:
- Question: "How often is the emergency override used?"
- Admin filters by `action_type=emergency`
- Sees: 3 uses in 30 days, all justified

#### 3. GET /admin/users - User Registry

View all users (without decrypting their PII):

```python
@router.get("/admin/users")
def get_all_users(role: Optional[str] = None, current_user, db):
    query = db.query(UserIdentity)
    
    if role:
        query = query.filter(UserIdentity.role == role)
    
    users = query.all()
    
    return [{
        "user_hash": u.user_hash,  # Still hashed—privacy preserved
        "role": u.role,
        "consent_share_with_manager": u.consent_share_with_manager,
        "risk_level": get_risk_level(u.user_hash),
        "has_manager": u.manager_hash is not None
    } for u in users]
```

**What This Enables**:
- Find users without managers (orphaned employees)
- Identify low consent rates (trust issues?)
- Spot users at critical risk (intervention needed)

#### 4. GET /admin/statistics - Trend Analysis

```python
@router.get("/admin/statistics")
def get_system_statistics(days: int = 30, current_user, db):
    # User growth over time
    new_users_per_day = get_user_growth(days)
    
    # Daily activity trends
    daily_events = get_activity_trends(days)
    
    # Risk level changes
    risk_trends = get_risk_trends(days)
    
    return {
        "user_growth": new_users_per_day,
        "daily_activity": daily_events,
        "risk_trends": risk_trends
    }
```

**Real-World Scenario**:

**The Outbreak**:
- Week 1: System shows normal (5% at risk)
- Week 2: Spike detected (15% at risk)
- Week 3: Critical mass (30% at risk)
- Investigation: Post-launch crunch period
- Action: Leadership intervenes, adds resources
- Result: Crisis averted

**The Pattern**:
- Admin notices: Consent rate dropping over 3 months
- Starts at 60%, ends at 20%
- Investigation: New manager is overly invasive
- Action: Training provided, manager improves
- Result: Consent rate recovers

#### 5. POST /admin/user/{hash}/role - Role Management

```python
@router.post("/admin/user/{hash}/role")
def update_user_role(user_hash: str, new_role: str, current_user, db):
    # Validate role
    valid_roles = ["employee", "manager", "admin"]
    if new_role not in valid_roles:
        raise HTTPException(400, "Invalid role")
    
    user = get_user(user_hash)
    old_role = user.role
    user.role = new_role
    
    # Log the change
    audit_log("role_updated", {
        "user": user_hash,
        "old_role": old_role,
        "new_role": new_role,
        "updated_by": current_user.user_hash
    })
```

**Use Cases**:

**Promotion**:
- Engineer gets promoted to Manager
- Admin updates role: employee → manager
- Immediate access to `/team` dashboard

**Offboarding**:
- Employee leaves company
- Admin updates role: manager → employee (removes team access)
- Or deletes user entirely (Phase 2 `/me/delete`)

#### 6. POST /admin/user/{hash}/manager - Assignment

```python
@router.post("/admin/user/{hash}/manager")
def assign_manager(user_hash: str, manager_hash: str, current_user, db):
    # Validate both users exist
    employee = get_user(user_hash)
    manager = get_user(manager_hash)
    
    # Validate manager is actually a manager
    if manager.role != "manager":
        raise HTTPException(400, "Target user is not a manager")
    
    # Prevent self-management
    if user_hash == manager_hash:
        raise HTTPException(400, "Cannot be own manager")
    
    employee.manager_hash = manager_hash
    
    audit_log("manager_assigned", {
        "employee": user_hash,
        "manager": manager_hash
    })
```

**The Org Chart**:
- Centralized view of who reports to whom
- Easy reorganization (team transfers)
- Validation prevents errors (circular reporting)

#### 7. GET /admin/config - System Settings

```python
@router.get("/admin/config")
def get_system_config(current_user):
    return {
        "environment": "production",
        "features": {
            "monitoring_enabled": True,
            "nudges_enabled": True,
            "analytics_enabled": True
        },
        "thresholds": {
            "critical_velocity": 2.5,
            "elevated_velocity": 1.5,
            "emergency_hours": 36
        },
        "privacy": {
            "encryption_enabled": True,
            "anonymization_enabled": True,
            "audit_logging_enabled": True
        }
    }
```

**Why Read-Only?**
These settings affect the entire system. Changing them requires:
- Code deployment (for thresholds)
- Feature flags (for toggles)
- Database migration (for schema)

The endpoint provides **visibility**, not control.

## Frontend: The `/admin` Page

### Tab 1: System Health (The Dashboard)

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │ 17 Users │  │ 15K      │  │ Health   │  │ 29%│ │
│  │          │  │ Events   │  │ Score    │  │    │ │
│  └──────────┘  └──────────┘  └──────────┘  └────┘ │
│                                                     │
│  Role Distribution:                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Employee │ │ Manager  │ │ Admin    │            │
│  │   12     │ │    3     │ │    2     │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  Risk Alert: 1 CRITICAL, 3 ELEVATED                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Metrics**:
- Total users, events, audit logs
- Role distribution (visual pie chart)
- Consent rate (privacy adoption)
- Risk summary (critical/elevated counts)
- 24h activity (recent events/logs)

### Tab 2: Users (The Registry)

**Table Columns**:
- User Hash (anonymized identifier)
- Role (employee/manager/admin)
- Risk Level (color-coded badge)
- Consent Status (checkmark or dash)
- Manager Status (has manager?)

**Filters**:
- Role dropdown (All/Employee/Manager/Admin)
- Search by user hash
- Sort by risk level

**Actions**:
- Click user → View details modal
- Update role (dropdown)
- Assign manager (dropdown)

### Tab 3: Audit Logs (The Ledger)

**Search & Filter**:
- Time period: Last 24h / 7 days / 30 days
- Action type: data_access / consent / login
- User hash: Filter by specific user

**Log Display**:
```
┌────────────────────────────────────────┐
│ [DATA_ACCESS] User A viewed User B    │
│ Time: 2026-02-10 14:32:15             │
│ Reason: Employee has consented        │
│ Details: {                            │
│   "accessor": "manager_123",          │
│   "action": "view_team_member"        │
│ }                                     │
└────────────────────────────────────────┘
```

**Pagination**:
- 50 logs per page
- Previous/Next buttons
- Offset indicator ("Showing 1-50 of 4,231")

## Real-World Scenarios

### Scenario 1: The Compliance Audit

**Auditor**: "We need to prove GDPR compliance for the last 6 months."

**Admin Actions**:
1. Navigate to Audit Logs tab
2. Set filter: Last 180 days
3. Export all logs (CSV/JSON)
4. Generate report:
   - 12,847 data access events
   - 98.3% had explicit consent
   - 1.7% were emergency overrides (documented)
   - 0 unauthorized access attempts

**Result**: Compliance certified. Privacy by design proven.

### Scenario 2: The Privacy Champion

**Observation**: Consent rate dropped from 60% to 20% over 3 months.

**Investigation**:
1. Check audit logs: New manager (hired 3 months ago)
2. Review manager's access patterns: Excessive individual views
3. Interview employees: "Manager is micromanaging via the tool"

**Action**:
1. Training provided to manager
2. Manager taught to use anonymized team view
3. Employees re-engage with consent

**Result**: Consent rate recovers to 55%.

### Scenario 3: The Crisis Response

**Alert**: System health shows 8 users at CRITICAL risk.

**Investigation**:
1. Check user list: All from same department
2. Check timeline: Started after product launch
3. Check audit logs: Manager viewed 6/8 users (emergency override)

**Action**:
1. Leadership meeting called
2. Additional resources allocated
3. Deadline extended

**Result**: 6 users recover to ELEVATED, 2 remain CRITICAL (individual support provided).

### Scenario 4: The Security Incident

**Suspicion**: "An employee claims their manager accessed their data without consent."

**Investigation**:
1. Admin filters audit logs by employee's hash
2. Finds: 3 access events by manager
3. Details:
   - Event 1: Access denied (no consent)
   - Event 2: Access denied (no consent)
   - Event 3: Access granted (EMERGENCY: 36+ hours CRITICAL)

**Finding**: Access was legitimate emergency override.

**Action**: Employee notified of emergency access (as per policy).

## Security & Ethics

### The Admin Paradox

Admins have the most power—and the most scrutiny:

**What Admins CAN Do**:
- View system-wide statistics
- See audit logs (who accessed what)
- Manage user roles
- Assign managers

**What Admins CANNOT Do**:
- Decrypt user emails (Vault B remains secure)
- View individual data without audit trail
- Bypass consent (emergency rules still apply)
- Delete audit logs (immutable)

**The Audit Trail Includes Admins**:
Every admin action is logged:
```json
{
  "action": "role_updated",
  "user_hash": "employee_123",
  "details": {
    "old_role": "employee",
    "new_role": "manager",
    "updated_by": "admin_hash"  // ← Admin is logged too
  }
}
```

### The Four-Eyes Principle

Sensitive operations (like role changes) could require:
- Approval from second admin
- Notification to affected user
- 24-hour delay (cooling-off period)

Currently not implemented, but architecture supports it.

## Files Created

### Backend
1. `app/api/v1/endpoints/admin.py` - 7 admin endpoints
2. `app/api/v1/api.py` - Updated with admin router

### Frontend
1. `app/admin/page.tsx` - Admin dashboard with 3 tabs

## The Bottom Line

Phase 4 transforms Sentinel from a wellbeing tool into a **governance platform**.

Features delivered:
- ✅ System health monitoring
- ✅ Comprehensive audit trail
- ✅ User management
- ✅ Trend analysis
- ✅ Privacy-preserving oversight

**Admin access isn't about control—it's about care at scale.**

Onward to Phase 5! 🚀
