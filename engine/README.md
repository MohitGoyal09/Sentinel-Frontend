# Sentinel Context Engine

Everything an AI agent needs to understand the Sentinel / AlgoQuest project.
Read any single file for useful, self-contained context. Read all files for the full picture.

## Files

| File | What It Covers |
|------|---------------|
| [OVERVIEW.md](OVERVIEW.md) | What Sentinel is, who it's for, why it matters |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture, data flow, system design |
| [FEATURES.md](FEATURES.md) | Complete feature inventory with status |
| [TECH_STACK.md](TECH_STACK.md) | Languages, frameworks, dependencies, infrastructure |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schemas, table relationships, two-vault privacy |
| [API_REFERENCE.md](API_REFERENCE.md) | All endpoints grouped by domain |
| [AGENTS.md](AGENTS.md) | 3-agent orchestrator architecture (org/task/general) |
| [RBAC.md](RBAC.md) | Roles, permissions, anonymization rules |
| [COMPOSIO.md](COMPOSIO.md) | MCP Tool Router, OAuth flow, tool execution |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | UI rules, colors, typography, components |
| [DEMO.md](DEMO.md) | Demo credentials, seed data personas, demo script |
| [ROADMAP.md](ROADMAP.md) | What's done, what's planned, what's deferred |
| [CEO_ANALYSIS.md](CEO_ANALYSIS.md) | Strategic analysis, competitive positioning, risks |
| [PITCH_STRATEGY.md](PITCH_STRATEGY.md) | Industry-tailored pitch strategy, objection matrix |
| [REAL_WORLD.md](REAL_WORLD.md) | Real-world validation, case studies, ROI evidence |
| [JUDGES.md](JUDGES.md) | 12 judge profiles, backgrounds, what they care about |
| [PITCH_PREP.md](PITCH_PREP.md) | Demo script, 3-minute flow, rehearsal checklist |
| [SCORING.md](SCORING.md) | How metadata becomes risk scores: formulas, thresholds, code references |
| [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) | Competitor comparison, loopholes, gaming defenses, roadmap to close gaps |
| [PS_COMPLIANCE.md](PS_COMPLIANCE.md) | Problem statement vs implementation: compliance scoring, evolution story, judge answers |

## How to Use This Directory

- **Starting a new feature?** Read ARCHITECTURE.md and TECH_STACK.md first.
- **Touching the database?** Read DATA_MODEL.md for the two-vault rules.
- **Building UI?** Read DESIGN_SYSTEM.md for mandatory visual rules.
- **Working on chat?** Read AGENTS.md for the 3-agent orchestrator.
- **Adding permissions?** Read RBAC.md for the 52-permission matrix.
- **Preparing a demo?** Read DEMO.md for credentials and walkthrough.
- **Understanding the business?** Read OVERVIEW.md and CEO_ANALYSIS.md.
- **Preparing for hackathon?** Read JUDGES.md and PITCH_STRATEGY.md for judge profiles and tailored pitch.
- **Rehearsing the pitch?** Read PITCH_PREP.md for demo script and REAL_WORLD.md for validation evidence.

## Project Location

```
/Users/mohit/Code/AlgoQuest/
  backend/       Python 3.12 / FastAPI
  frontend/      Next.js 16 / React 19 / TypeScript
  docs/          Extended documentation
  engine/        THIS DIRECTORY — context for AI agents
```
