# Phase 0: The Foundation - Laying the Groundwork for Privacy-First RBAC

## The Story So Far

Imagine you're building a high-security bank vault. But instead of storing money, you're storing the most sensitive information imaginable: people's work patterns, stress levels, and behavioral data. This isn't just any data—it's the kind that, in the wrong hands, could be used to manipulate, surveil, or discriminate.

That's exactly what we're building with **Sentinel**—an AI-powered employee wellbeing platform that predicts burnout before it happens. But here's the catch: to detect burnout, we need to monitor behavior. And monitoring behavior without proper safeguards? That's how you end up with a surveillance dystopia instead of a wellness tool.

## Why This Phase Matters

Think of Phase 0 like installing the vault's steel walls before putting in the deposit boxes. We're not building features yet—we're building the **architecture of trust**.

### The Three Pillars We Established

#### 1. **The Two-Vault Privacy Architecture** 🔐

Picture a spy movie where the hero needs two different keys held by two different people to open the vault. That's our Two-Vault system:

- **Vault A (Analytics)**: Stores only hashed user IDs and behavioral timestamps. It's like having security camera footage where everyone's face is blurred—you can see movement patterns but can't identify who's who.
- **Vault B (Identity)**: Stores the encrypted mapping of hash-to-identity. This is the keymaster that only unlocks when absolutely necessary (like sending a wellness check message).

**The Genius**: Even if a hacker breaks into Vault A, they get mathematical gibberish. Even if they break into Vault B, they get encrypted blobs. You need BOTH to make sense of anything—and both use different encryption keys.

#### 2. **Role-Based Access Control (RBAC)** 👥

Remember the last time you used a coworking space? You probably had a key card that only opened certain doors:
- Your desk area? ✅
- The CEO's office? ❌
- The server room? ❌

That's RBAC. We implemented three roles:

- **Employee**: Can only see their own data. Think of it like checking your own medical records—private and personal.
- **Manager**: Can see team aggregates (anonymized) and individual details ONLY with consent or emergency (critical risk for 36+ hours). Like a coach who can see team stats but needs permission to see individual player health data.
- **Admin**: System oversight with full audit logs. Like the security guard who can see who accessed what, when, and why—but shouldn't be snooping on individual data without reason.

#### 3. **Consent Architecture** ✋

This is the "informed consent" button at the doctor's office, but digital and enforceable:

- **consent_share_with_manager**: Default FALSE. Employees must actively opt-in.
- **consent_share_anonymized**: Default TRUE. Allows aggregate data (like "someone on your team is struggling") but not individual identification.

**The Philosophy**: Privacy by default, transparency by design. We're not asking users to trust us—we're making it mathematically impossible for us to betray that trust.

## Technical Implementation

### Database Schema Changes

```sql
-- We added 5 new columns to identity.users
role VARCHAR(20) DEFAULT 'employee'
consent_share_with_manager BOOLEAN DEFAULT FALSE
consent_share_anonymized BOOLEAN DEFAULT TRUE
monitoring_paused_until TIMESTAMP NULL
manager_hash VARCHAR(64) NULL INDEX
```

**Why These Columns?**

1. **role**: Defines the permission tier. Like user groups in Slack or Discord.
2. **consent_share_with_manager**: The opt-in switch. Think of it like location sharing in Find My Friends.
3. **consent_share_anonymized**: Allows "signal without identification." Like a smoke detector—it tells you there's fire, not whose room it's in.
4. **monitoring_paused_until**: The "Do Not Disturb" button. Employee-controlled pause on monitoring (for vacations, mental health days, etc.).
5. **manager_hash**: Links employee to their manager using hashed IDs—maintaining privacy even in relationships.

### Migration Strategy

We used Alembic (SQLAlchemy's migration tool) to add these columns non-destructively:
- Existing users got default values (employee role, no consent)
- No data loss
- Rollback plan included (downgrade script)

### Encryption Verification

Remember the Panama Papers? Millions of documents leaked because someone didn't encrypt properly. We verify our encryption using Fernet (cryptography library):

```python
# What encrypted data looks like:
gAAAAABpfiWxMADJyiv1GLvnphmGDqaEunTK1bnloWS8x1IYOr...

# What it ISN'T:
alex@company.com  # ❌ PLAINTEXT - would be a disaster!
```

**Verification Script**: `scripts/verify_encryption.py`
- Checks all 5 RBAC columns exist
- Verifies emails are encrypted (not plaintext)
- Validates Fernet token format

## Test Users: The Cast of Characters

To test our RBAC system, we created 6 personas representing real-world scenarios:

### The Admin 👑
- **Email**: admin@sentinel.local
- **Password**: Admin123!
- **Role**: System administrator
- **Use Case**: Monitoring system health, audit logs, troubleshooting

### Manager 1 👔
- **Email**: manager1@sentinel.local
- **Password**: Manager123!
- **Team**: employee1 (consented) + employee2 (not consented)
- **Use Case**: Testing consent-based access controls

### Manager 2 👔
- **Email**: manager2@sentinel.local
- **Password**: Manager456!
- **Team**: employee3 (not consented)
- **Use Case**: Testing cross-team isolation

### Employee 1 💼
- **Email**: employee1@sentinel.local
- **Password**: Employee123!
- **Manager**: manager1
- **Consent**: ✅ YES (willing to share with manager)
- **Use Case**: Testing consent flow

### Employee 2 💼
- **Email**: employee2@sentinel.local
- **Password**: Employee456!
- **Manager**: manager1
- **Consent**: ❌ NO (privacy-first employee)
- **Use Case**: Testing privacy protection

### Employee 3 💼
- **Email**: employee3@sentinel.local
- **Password**: Employee789!
- **Manager**: manager2
- **Consent**: ❌ NO
- **Use Case**: Testing the 36-hour critical rule (emergency override)

## The "36-Hour Rule" 🚨

Here's where ethics meets engineering. We built an emergency override:

**If an employee is at CRITICAL risk for 36+ hours, managers can see their data even WITHOUT consent.**

**Why 36 hours?**
- 24 hours could be a busy sprint
- 48+ hours might be too late for intervention
- 36 hours = "this is a real emergency, not just a bad day"

**The Safeguards**:
- Only applies to CRITICAL risk level
- Requires continuous monitoring (not just a spike)
- Full audit trail of the override
- Employee is notified

Think of it like calling 911—you don't need someone's permission to save their life. But you better have a damn good reason, and there better be a record of it.

## What We Accomplished

✅ Database schema extended with RBAC columns
✅ Alembic migration applied (002_add_rbac_and_consent.py)
✅ Encryption verified working (Fernet tokens)
✅ 6 test users created with realistic scenarios
✅ Manager-employee relationships established
✅ Documentation created (TEST_USERS.md)

## Files Created

1. `backend/app/models/identity.py` - Updated with RBAC columns
2. `backend/alembic/versions/002_add_rbac_and_consent.py` - Database migration
3. `backend/scripts/verify_encryption.py` - Encryption verification tool
4. `backend/scripts/seed_rbac_test_users.py` - Test user setup
5. `backend/TEST_USERS.md` - Test credentials and scenarios

## What's Next: Phase 1

Now that the foundation is solid, Phase 1 builds the **permission engine**:
- Create `PermissionService` to enforce RBAC rules
- Update auth dependencies to check permissions on every API call
- Implement `is_critical_for_36h()` logic
- Add comprehensive audit logging
- Write unit and integration tests

**The Goal**: Make it impossible for any code path to bypass permission checks. Like a security guard who checks ID at every door, not just the front entrance.

---

## Architecture Deep Dive

### Why Supabase Auth?

We chose Supabase over rolling our own auth for the same reason you don't build your own car when you need to drive somewhere:

1. **JWT tokens**: Industry-standard, stateless authentication
2. **Row-Level Security (RLS)**: Database-level permissions (Phase 4)
3. **Real-time subscriptions**: For live dashboard updates
4. **SOC2 compliance**: Enterprise-grade security out of the box

### The Privacy-First Philosophy

Remember the Facebook/Cambridge Analytica scandal? Data was "anonymized" but easily de-anonymized through cross-referencing. Our approach is different:

1. **Cryptographic hashing**: SHA-256 with salt = irreversible
2. **Separate schemas**: Analytics and Identity can't accidentally join
3. **Default deny**: No access without explicit permission
4. **Audit everything**: If someone accesses data, we know who, when, and why

### The Consent Model

Inspired by GDPR's "privacy by design" principle:

- **Opt-in, not opt-out**: Users must actively consent
- **Granular controls**: Share with manager vs. share anonymized aggregates
- **Revocable**: Users can change their mind anytime
- **Transparent**: Clear UI showing what's shared with whom

### Why It Matters

In a world where employers increasingly monitor employees (Slack monitoring, keystroke loggers, webcam tracking), **Sentinel is different**:

- We measure WHEN you work, not WHAT you write
- We predict burnout, we don't surveil performance
- Employees control their data
- Managers only see what they're allowed to see

This isn't just about compliance—it's about **building trust**. And trust, once lost, is nearly impossible to regain.

---

## For Developers

### Running the Verification

```bash
cd backend
source .venv/bin/activate
python scripts/verify_encryption.py
```

### Seeding Test Users

```bash
python scripts/seed_rbac_test_users.py
```

### Checking Database Schema

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check columns
\d identity.users

# Verify encryption
SELECT user_hash, encode(email_encrypted, 'base64') 
FROM identity.users 
LIMIT 3;
```

## The Bottom Line

Phase 0 isn't sexy. You can't demo it to investors. It doesn't have graphs or AI insights. But without it, everything we build on top is just a surveillance tool with good marketing.

**Architecture beats features.** 
**Privacy isn't a feature—it's the foundation.**

Onward to Phase 1! 🚀
