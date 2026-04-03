# Sentinel Demo Credentials

All accounts use password: **` `**

## Admin Accounts (Full org access)

| Email | Name | Role | Team |
|-------|------|------|------|
| admin@acme.com | Sarah Chen | Admin | - |
| cto@acme.com | James Wilson | Admin | - |

## Manager Accounts (Team-scoped access)

| Email | Name | Role | Team |
|-------|------|------|------|
| eng.manager@acme.com | Priya Sharma | Manager | Engineering |
| design.manager@acme.com | Alex Rivera | Manager | Design |
| data.lead@acme.com | Chen Wei | Manager | Data Science |

## Employee Accounts (Personal data only)

| Email | Name | Role | Team | Risk Level |
|-------|------|------|------|------------|
| dev1@acme.com | Jordan Lee | Employee | Engineering | CRITICAL |
| dev2@acme.com | Maria Santos | Employee | Engineering | LOW |
| dev3@acme.com | David Kim | Employee | Engineering | ELEVATED |
| dev4@acme.com | Emma Thompson | Employee | Engineering | LOW |
| designer1@acme.com | Noah Patel | Employee | Design | LOW |
| designer2@acme.com | Olivia Zhang | Employee | Design | ELEVATED |
| analyst1@acme.com | Liam Carter | Employee | Data Science | LOW |
| analyst2@acme.com | Sofia Martinez | Employee | Data Science | LOW |

## Recommended Demo Flow

1. **Login as Admin** (`admin@acme.com`) - See org-wide dashboard, all teams, pipeline health
2. **Login as Manager** (`eng.manager@acme.com`) - See Engineering team, 4 direct reports, Jordan's CRITICAL risk
3. **Login as Employee** (`dev1@acme.com`) - See personal burnout risk (CRITICAL), self-care recommendations
4. **Ask Sentinel** - Chat with the AI assistant (different context per role)

## Reseed Command

```bash
cd backend && .venv/Scripts/python -m scripts.seed_fresh
```

## Organization

- **Name**: Acme Technologies
- **Plan**: Enterprise
- **Teams**: Engineering (4 members), Design (2 members), Data Science (2 members)
