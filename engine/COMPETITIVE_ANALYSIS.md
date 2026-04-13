# Competitive Landscape Analysis

Pre-hackathon reference for the team. No fluff, just what we're up against and where we stand.

---

## The 5 Main Competitors

### 1. Microsoft Viva Insights

**What they do:** Passive behavioral signals from M365 (email, calendar, Teams). The closest to our approach.

- **Data approach:** Meeting hours, email volume, focus time, collaboration patterns -- all derived from M365 signals. No surveys required.
- **False positive strategy:** Team-level aggregates only. They refuse to surface individual scores. Minimum team size of 5 before any data appears. This sidesteps false positives by never making individual claims.
- **Gaming strategy:** They don't really address it. Since they only show team aggregates, gaming by one person doesn't move the needle. The sheer volume of M365 telemetry also makes sustained gaming impractical.
- **Data quality:** Locked into M365 ecosystem. If your org uses Slack + Google Workspace, Viva is blind. No cross-platform signal.
- **Privacy:** Differential privacy on aggregates, no individual dashboards for managers. Microsoft's massive compliance team means SOC2, GDPR, etc. are table stakes for them.

### 2. Culture Amp

**What they do:** Survey-first platform. Engagement surveys, pulse checks, onboarding surveys, exit surveys.

- **Data approach:** Psychometrically validated survey instruments. They've spent years calibrating question wording and response scales.
- **False positive strategy:** Benchmark database of 6,000+ companies. They don't just tell you "your engagement score is 72" -- they tell you "72 is in the 45th percentile for Series B SaaS companies with 50-200 employees." Context kills false positives.
- **Gaming strategy:** Psychometric validation catches inconsistent responses. If you answer "strongly agree" to contradictory statements, the survey flags it. They also anonymize responses below a threshold (typically 5 respondents).
- **Data quality:** Surveys are inherently self-reported. Response rates vary (industry average ~65%). Non-responders are often the most disengaged -- creating survivorship bias in the data.
- **Privacy:** Anonymity thresholds, no individual attribution below team size minimums.

### 3. Workday Peakon

**What they do:** Continuous pulse surveys with NLP on open-ended responses.

- **Data approach:** Short pulse surveys (5-10 questions) sent weekly or bi-weekly. NLP engine processes free-text responses to extract themes and sentiment. Driver analysis identifies which factors most influence engagement.
- **False positive strategy:** Confidence intervals on every metric. They don't say "engagement is 7.2" -- they say "engagement is 7.2 +/- 0.4 at 95% confidence." Driver analysis surfaces the actual levers: "Manager relationship explains 34% of variance in this team's engagement."
- **Gaming strategy:** Frequency helps -- weekly pulses mean one gamed response gets diluted quickly. NLP catches copy-paste or nonsensical free-text answers.
- **Data quality:** Better than annual surveys because of frequency. But still self-reported. Survey fatigue is real -- response rates drop over time if employees don't see action taken on results.
- **Privacy:** Anonymous by default, minimum response thresholds, GDPR compliant.

### 4. Lattice

**What they do:** Unified performance management -- reviews, surveys, 1:1 notes, OKRs, compensation.

- **Data approach:** Multi-signal but all human-generated. Performance review scores, 360 feedback ratings, engagement survey responses, manager 1:1 notes, OKR completion rates. The breadth is the differentiator.
- **False positive strategy:** 360 feedback cross-references self-assessment with peer, manager, and report evaluations. Divergence between self-score and peer-score is itself a signal. OKR completion provides objective ground truth.
- **Gaming strategy:** Hard to game 360 feedback from 5+ raters simultaneously. OKR completion is somewhat objective (though OKR quality varies). Manager 1:1 notes provide qualitative context.
- **Data quality:** Depends entirely on organizational discipline. Companies that half-ass their review process get garbage data. The tool is only as good as the culture using it.
- **Privacy:** Manager visibility into direct report data. HR visibility across organization. Less privacy-forward than survey-only tools.

### 5. Qualtrics Employee Experience (EX)

**What they do:** Surveys + HRIS data integration + ML models trained on actual turnover outcomes.

- **Data approach:** Survey responses triangulated with HRIS data (tenure, compensation, PTO usage, promotion history, role changes). Their Predict iQ model is trained on historical attrition data from their customer base.
- **False positive strategy:** ML models trained on actual turnover outcomes. They can say "employees with this survey pattern + this tenure + this comp ratio have a 73% probability of leaving within 6 months" because they've seen it happen thousands of times. This is the gold standard right now.
- **Gaming strategy:** HRIS data can't be gamed (you can't fake your tenure or PTO balance). Survey responses can be gamed, but the HRIS triangulation catches mismatches. If someone says "I'm very satisfied" but hasn't taken PTO in 8 months and was passed over for promotion, the model weighs the behavioral signals more heavily.
- **Data quality:** Strongest in the market because of the survey + HRIS combination. The historical training data gives them predictive accuracy no one else can match.
- **Privacy:** Depends on HRIS integration depth. Some configurations expose individual-level data to HR. Enterprise-grade compliance (FedRAMP, SOC2, ISO 27001).

---

## Competitive Matrix

| Dimension | Viva Insights | Culture Amp | Peakon | Lattice | Qualtrics EX | **Sentinel** |
|---|---|---|---|---|---|---|
| **Data approach** | M365 passive signals | Validated surveys | Pulse surveys + NLP | Reviews + surveys + OKRs | Surveys + HRIS + ML | Passive behavioral metadata |
| **False positive strategy** | Team aggregates only | 6000+ company benchmarks | Confidence intervals + drivers | 360 cross-referencing | ML on actual turnover (73%) | Three-signal requirement + personal baselines |
| **Gaming strategy** | Volume makes it impractical | Psychometric validation | Frequency dilution | Multi-rater cross-check | HRIS can't be gamed | Hawthorne effect + 21-day sustained requirement |
| **Privacy** | Differential privacy, no individual | Anonymity thresholds | Anonymous, GDPR | Manager-visible | Configurable, enterprise | Two-vault architecture, metadata-only |
| **Speed to insight** | Real-time (within M365) | Survey cycle dependent | Weekly pulse cadence | Review cycle dependent | Survey + HRIS sync lag | 21-day baseline + real-time drift |
| **Content access** | Yes (email/Teams content) | Yes (survey responses) | Yes (free-text NLP) | Yes (review text, 1:1 notes) | Yes (survey + HRIS records) | **No (metadata only)** |
| **Employee participation** | None required | Required (surveys) | Required (surveys) | Required (reviews, surveys) | Required (surveys) | **None required** |

---

## Sentinel's Advantages

### No surveys needed
Every competitor except Viva requires employees to actively participate. Survey fatigue is real. Response rates degrade. Non-responders are systematically different from responders. We skip all of that.

### Metadata-only is genuinely novel
This is not marketing spin. Every competitor in this space either reads content (Viva reads email bodies, Peakon runs NLP on free-text, Lattice stores 1:1 notes) or requires employees to self-report. We do neither. We look at commit timestamps, PR counts, message frequency -- never the content itself.

### Three-signal requirement is more conservative than competitors
Most competitors will flag someone based on a single signal source (one bad survey, one drop in email volume). We require convergent signals from three independent sources before generating an alert. This is deliberately conservative -- we'd rather miss a true positive than create a false one.

### Two-vault privacy architecture
Hot vault (behavioral metadata) and cold vault (identity mapping) are physically separated. The analysis engine never sees who it's analyzing. Re-identification requires explicit authorization with audit trail. No competitor has this architecture -- most don't need it because they already know who submitted which survey.

---

## Sentinel's Honest Disadvantages

We need to own these, especially if judges push on them.

### No validated accuracy
Qualtrics can say "73% historical prediction accuracy on 6-month attrition." We can say... nothing yet. We have no historical data, no validation cohort, no ground truth to train against. Our three-signal approach is theoretically sound but empirically unproven. This is our single biggest weakness.

### No benchmark database
Culture Amp's 6,000+ company benchmark database lets them contextualize every score. "Your engineering team's engagement is in the 60th percentile compared to similar companies." We have zero benchmarks. Every signal is interpreted against an individual's own baseline only. We can't tell you if a pattern is normal for your industry or alarming.

### No HRIS data
Qualtrics triangulates survey data with tenure, compensation, PTO usage, promotion history. These are powerful signals that we don't have access to. Someone who hasn't taken PTO in 8 months and was passed over for promotion is a flight risk regardless of what their commit patterns look like. We're blind to these organizational context signals.

### No content analysis
This is simultaneously our biggest advantage (privacy) and our biggest limitation. Peakon's NLP on open-ended survey responses catches things metadata never will. Someone writing "I'm actively interviewing" in a survey is a stronger signal than any commit frequency drop. We trade signal richness for privacy.

---

## The Killer Positioning Line

> **"Every competitor either reads your content or requires your participation. We do neither."**

This is the one sentence that separates us from everything else in the market. It's true, it's defensible, and it's the thing judges will remember.

Supporting points:
- Viva reads your emails and Teams messages. We don't.
- Culture Amp and Peakon require you to fill out surveys. We don't.
- Lattice reads your performance reviews and 1:1 notes. We don't.
- Qualtrics reads your surveys AND your HR records. We don't.

We observe the shape of work, not its substance.

---

## Known Loopholes and How We Handle Them

These are the gaming vectors that a sharp judge (or a sharp employee) will identify. Here's how we address each one.

### README-only commits
**The attack:** Employee pads commit count by making trivial README edits.
**Our defense:** Talent Scout tracks `files_changed` metadata. A commit touching 1 file with 2 lines changed scores differently than a commit touching 15 files with 200 lines changed. We don't read the content, but file count and change volume are metadata we do capture.
**Remaining gap:** Someone could make meaningfully-sized but still trivial changes. Weighted event scoring (roadmap) will partially address this.

### PR rubber stamps
**The attack:** Reviewer approves PRs instantly without actually reviewing.
**Our defense:** Talent Scout tracks `comment_length` on PR reviews. A one-word "LGTM" approval is weighted differently than a 200-word review with inline comments. Review turnaround time is also a signal -- approving a 500-line PR in 30 seconds is itself a pattern.
**Remaining gap:** Someone could write long but meaningless review comments. Content analysis would catch this, but we don't do content analysis. Accept this tradeoff.

### Gaming by scheduling commits
**The attack:** Employee writes a script to auto-commit at regular intervals to fake consistent activity.
**Our defense:** Two factors work in our favor. First, Hawthorne effect -- the act of maintaining a gaming script is itself effortful. Second, sustained gaming must persist for 21 days (our baseline window) to actually shift the baseline. After that, the gamed pattern becomes the new normal, and any deviation from the gamed pattern triggers the same alerts. You'd have to game forever, consistently, across multiple signal sources.
**Remaining gap:** A sufficiently motivated person could do it. But gaming Git, Slack, and calendar simultaneously for 21+ days is a full-time job on top of your actual full-time job.

### Different roles with different patterns
**The concern:** Not really an attack -- more of a fairness issue. A senior architect who writes design docs has different commit patterns than a junior dev who ships features daily.
**Our defense:** Personal baselines, not absolute thresholds. We never compare Alice's commit frequency to Bob's. We compare Alice's commit frequency to Alice's own 21-day rolling baseline. An architect who normally commits twice a week and drops to zero is flagged the same way a dev who normally commits 20 times a week and drops to 5 would be.
**Remaining gap:** Role changes, project transitions, and vacation returns all create legitimate baseline disruptions. Context-aware baseline resets are on the roadmap.

### Multi-source signal strength
**The concern:** Some employees only use one or two of our signal sources (e.g., a designer who doesn't write code).
**Our defense:** Currently, we require three convergent signals. This means we simply can't analyze people who only appear in one or two sources.
**Remaining gap:** This is a real coverage gap. Future: `source_count` confidence multiplier -- alerts from 5 sources weighted higher than alerts from 3 sources, and we set a minimum source threshold below which we don't generate alerts at all.

---

## Roadmap to Close Gaps

These are the concrete technical investments that move us from "interesting hackathon project" to "defensible product."

### 1. Weighted event scoring
**What:** `files_changed * log(additions + deletions)` as a commit quality proxy.
**Why:** Raw commit count is too gameable. Weighting by change volume makes trivial commits worth less without reading content.
**Effort:** Small. Metadata already collected, just need the scoring formula in the aggregation layer.

### 2. Multi-source confidence multiplier
**What:** Alerts from more signal sources get higher confidence scores. 5-source convergence > 3-source convergence.
**Why:** More independent signals confirming the same pattern is stronger evidence. Also lets us set a minimum source threshold for alert generation.
**Effort:** Medium. Need to refactor the alert scoring pipeline to be source-count-aware.

### 3. Shadow deployment framework
**What:** Run Sentinel alongside existing HR tools for 6+ months. Compare our alerts against actual attrition outcomes. Build our own accuracy numbers.
**Why:** We can't claim accuracy without this. Qualtrics has 73% historical accuracy. We need our own number, whatever it turns out to be.
**Effort:** Large. Need a design partner willing to run both systems. Need to build the comparison analytics. 6-month minimum timeline.

### 4. HRIS integration
**What:** Pull tenure, role, level, team, and (with consent) compensation data from Workday/BambooHR/Rippling.
**Why:** Organizational context makes behavioral signals dramatically more meaningful. A commit frequency drop during a reorg means something different than a drop during steady-state.
**Effort:** Large. HRIS APIs are a mess. Each provider is different. Privacy implications are significant -- HRIS data is much more sensitive than behavioral metadata.

### 5. Benchmark database
**What:** Aggregate anonymized baseline patterns across customers to build industry/size/stage benchmarks.
**Why:** "Your engineering team's behavioral patterns are unusual compared to similar companies" is a much more powerful insight than "Alice's patterns changed."
**Effort:** Very large. Need critical mass of customers first. Need rock-solid anonymization. Need statistical rigor in cohort definitions. This is a 2+ year play.

---

## Bottom Line for the Demo

Lead with the positioning line. Acknowledge the accuracy gap honestly if asked -- judges respect honesty more than hand-waving. Point to the shadow deployment framework as the answer.

The story is: "We built the privacy-first approach. Now we need to prove the accuracy. Here's exactly how we plan to do that."

Don't claim we're better than Qualtrics at prediction. Claim we're better than everyone at privacy. That's true today, and it's the thing that gets harder to copy the longer we have a head start.
