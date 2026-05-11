# Smear Coaching Agent — Claude Code Context

## What this project is

Extending smear.app with two parallel additions:
1. A live coaching feature shipped inside the Smear app — contextual coaching card on the home screen + detail view
2. A Salesforce Agentforce integration in a Developer org — gym coach tool bridging Salesforce CRM data with live Supabase performance data

Both share a single GraphQL layer. Goal: advance Smear as a product while getting a foothold in the Salesforce ecosystem.

---

## Existing stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router 7 |
| Backend | FastAPI (Python) on Render — `backend/app/main.py`, routers at `backend/app/routers/` |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (JWT bearer tokens, validated via `backend/app/deps.py`) |
| Hosting | Vercel (frontend), Render (backend) |
| AI | Anthropic API — **model: `claude-haiku-4-5-20251001`** with prompt caching on system prompt block |

**Current `backend/requirements.txt`:**
```
fastapi==0.128.8
uvicorn[standard]==0.39.0
httpx==0.28.1
supabase==2.28.1
python-dotenv==1.2.1
```
Both `strawberry-graphql[fastapi]` and `anthropic` need to be added.

**Why Haiku over Sonnet:** coaching generation is structured stats in → 2–3 sentence output. Haiku handles this well at ~$1/month for 100 active users vs. ~$4 for Sonnet. Prompt caching on the system prompt drops cost a further ~90% on cache hits. Same SDK, same integration, just swap the model string.

**Stats: partially server-side, partially client-side.**

Per-session aggregates are materialized at session close: the `sessions` table stores `total_climbs`, `sends`, `flashes`, `attempts`, `hardest_grade_value`, `top_tags`, plus `insight_label`/`insight_reason`/`insight_classifier_version` (written by `backend/app/session_insights.py`).

An `archetype_scores` table also exists (`user_id`, `dimension`, `grade_value`, `sample_count`, `updated_at`) but currently has 0 rows — planned infrastructure not yet populated.

Cross-session aggregate stats (working grade across all time, trend direction, sessions/week, grade pyramid) are still computed client-side by the frontend (`frontend/src/features/stats/domain/`). The GraphQL `climberProfile` resolver can use the materialized `sessions` columns for send/flash rates and session counts rather than re-scanning all climbs rows.

**Supabase client** is initialized in `backend/app/gyms.py` via `get_supabase()` — use this function, do not create a new client.

---

## Existing routers (all mounted at `/api/v1`)

| File | Prefix | Key endpoints |
|---|---|---|
| `me.py` | `/me` | GET/PATCH profile, PATCH password/gym-preferences |
| `climbs.py` | `/climbs` | CRUD climbs, GET /meta, GET /recent |
| `sessions.py` | `/sessions` | GET /active, POST /{id}/end ← cache invalidation hook goes here |
| `social.py` | `/social` | feed, follows, reactions, comments |
| `canonical_climbs.py` | `/canonical-climbs` | deduplication, confidence scoring |
| `admin.py` | `/admin` | admin-only ops |
| `access_requests.py` | `/access-requests` | access management |
| `auth.py` | `/auth` | POST /register |
| `gyms.py` (inline in main.py) | — | GET /gyms, POST /gyms/seed-city |

---

## Coaching feature design

### Design principle
The coaching layer should feel like it already knew you were coming — not like you asked an AI a question. Every insight references a real number from the user's actual log. No chat interface, no "ask me anything" box.

### Four insight types

| Type | Trigger | Content |
|---|---|---|
| **Pre-session intent** | App open, no session today | Training plan + readiness signal based on rest days and archetype gaps |
| **Mid-session check-in** | Active session + user taps card | "How's it feeling?" → response branches the rest of the session nudge |
| **Post-session reflection** | Session close | What happened, one takeaway, one number called out |
| **Training focus** | Weekly / after every 3 sessions | Multi-week plan targeting archetype gaps, grade plateau, style blind spots |

### Style + grade targeting (now)
Claude generates a target from archetype gaps and grade trajectory — no canonical data needed:
- *"Warm up on V3–V4, then spend real time on a V5–V6 crimp or pinch problem. Avoid slab today — you need the overhang volume."*
- *"Your send rate at V5 is 68% over the last 5 sessions — you're ready to commit to V6 as your new project grade."*

### Specific climb recommendations (later — needs canonical coverage)
Once `canonical_climbs` has sufficient gym coverage, query by `gym_id` + grade range + `canonical_tags` matching style gaps:
- *"Try the orange pinch V5 on the cave wall — 12 people have logged it, matches your overhang gap."*

Same card, same surface. The coach goes from *"work on crimps at V5"* to *"that yellow crimp V5 in the main cave"* as data fills in. This is the canonical climb flywheel: more users logging → better coverage → better specific recommendations → more value → more users logging.

### Home screen card — state machine

One card, always present, content shifts based on climbing day state:

| State | Condition | Card content |
|---|---|---|
| **Pre-session** | No session today | Training intent: *"Project day. Your V5 send rate is ready — pick one V6 and commit."* |
| **Mid-session** | Active session exists | Check-in: *"45 min in. How's it feeling?"* |
| **Post-session** | Session ended today | One-line reflection: *"Good session. Volume up, grade down — intentional trade-off."* |
| **Rest / recovery** | 3+ days since last climb | Readiness: *"4 days rest. Your best sessions come after 3–4 days off — you're primed."* |

Tapping the card opens the coaching detail screen.

### Coaching detail screen (on tap)

Three sections, scrollable — not tabs:
1. **Today** — full pre-session plan or post-session reflection with referenced numbers
2. **Training focus** — 2–4 week plan targeting specific gaps (*"Close the overhang gap. One overhang session per week for 3 weeks."*)
3. **Watching** — 2–3 trends being tracked (*"Your V5 plateau is now 6 weeks."* / *"Flash rate up 12% over last month."*)

---

## What needs to be built

### Phase 1 — GraphQL layer (add to existing FastAPI on Render)

Add to `backend/requirements.txt`:
```
strawberry-graphql[fastapi]==0.264.0
anthropic>=0.52.0
```

Create `backend/app/routers/graphql_router.py`. Mount at `/graphql` in `main.py`.

**Queries:**

`climberProfile(userId: str)` — returns:
- `workingGrade`: float (median of top 40% sent grades — same formula as `_working_grade()` in `session_insights.py`)
- `sendRate`: float — from materialized `sessions.sends` / `sessions.total_climbs`
- `flashRate`: float — from materialized `sessions.flashes` / `sessions.sends`
- `archetype`: str (dominant tag category)
- `styleBreakdown`: list of `{tag: str, count: int}` — from `sessions.top_tags`
- `archetypeGaps`: list of `{tag: str, deficit: float}` — styles with low representation vs. working grade peers
- `gradePyramid`: list of `{grade: float, sends: int}` — from `climbs` table
- `sessionsPerWeek`: float — published sessions in last 90 days / 13
- `avgClimbsPerSession`: float — from materialized `sessions.total_climbs`
- `trendDirection`: str ("up" | "flat" | "down") — last 30 days working grade vs. prior 60 days
- `plateauWeeks`: int — weeks working grade has been within ±0.5 of current value
- `daysSinceLastSession`: int
- `gymName`: str — user's current gym from profile

Data sources:
- `sendRate`, `flashRate`, `avgClimbsPerSession`: materialized `sessions` columns — no climbs join
- `sessionsPerWeek`: count of published sessions in last 90 days
- `workingGrade`, `trendDirection`, `gradePyramid`, `plateauWeeks`: `climbs` table (`gym_grade_value` + `send_type`)
- `styleBreakdown`, `archetypeGaps`: `sessions.top_tags` aggregated

`recentSessions(userId: str, limit: int = 10)` — returns:
- `id`, `startedAt`, `gymName`, `totalClimbs`, `durationMinutes`, `workingGrade`, `insightLabel`

### Phase 2 — Coaching endpoints

Four endpoints, one per insight type. All authenticated via `get_current_user`. All cache in `coaching_insights` with `insight_type` discriminator.

```
GET /api/v1/coach/pre-session     → training intent + style/grade target
GET /api/v1/coach/post-session    → reflection on most recent closed session
POST /api/v1/coach/checkin        → body: {feeling: "good"|"tired"|"sore"} → mid-session nudge
GET /api/v1/coach/training-focus  → multi-week plan, regenerates every 3 sessions
```

All endpoints:
1. Check `coaching_insights` cache (`user_id` + `insight_type` + `is_valid = true`)
2. If miss: call `climberProfile` resolver logic directly, build prompt, call Haiku with prompt caching on system prompt block
3. Write to cache, return `{insight: str, generated_at: str}`

**Cache invalidation:** in `sessions.py` session close handler, set `is_valid = false` for `pre-session`, `post-session`, and `training-focus` rows for that `user_id`. Mid-session checkin is ephemeral — not cached.

**Prompt caching:** the system prompt (coach persona + instructions) is large and static — mark it with `cache_control: {"type": "ephemeral"}` to cache it across requests. The dynamic stats payload goes in the user turn.

### Phase 3 — Frontend coaching surface

**Home screen card** (`frontend/src/features/stats/components/CoachingStatusCard.tsx`):
- Reads state from active session + last session timestamp to determine which insight type to show
- Fetches appropriate endpoint based on state
- Single headline + one supporting line, ember accent
- Skeleton loader, hide silently on error
- Taps through to coaching detail screen

**Coaching detail screen** (`frontend/src/features/coaching/pages/CoachingDetailPage.tsx`):
- Route: `/coaching`
- Three sections: Today, Training Focus, Watching
- Each section fetches its own endpoint independently
- "Watching" section is client-computed from stats data (no new endpoint needed)

**`statsCards` config does not change.** The coaching surface is a separate feature, not a stats sub-page.

### Phase 4 — Salesforce Dev org

The Agentforce agent is a **gym coach tool** — not a climber self-service tool. It bridges two genuinely different data owners:

- **Topic 1 — Live climber performance** → calls GraphQL External Service (Render `/graphql`) → Supabase (what the climber self-logged in the Smear app)
- **Topic 2 — Coach-set goals and assessments** → calls Apex Action → Salesforce CRM (`Climber__c` has `Goal_Grade__c`, `Training_Focus__c`, `Coach_Notes__c`; `ClimbSession__c` has coach-logged assessments)

A coach asks: *"Is Jane on track for her V6 goal?"* → agent fetches Jane's goal from Salesforce (Topic 2) + Jane's current working grade from GraphQL (Topic 1) → synthesizes answer.

**Why two topics is architecturally honest:**
- Different data owners: gym/coach data vs. climber app data
- Different trust boundaries: what the coach prescribed vs. what the athlete reported
- "Why not just GraphQL for everything?" → GraphQL only has what the climber logged. Goals, assessments, and coach notes live in Salesforce because that's the gym's system of record.

**Custom objects** (`salesforce/force-app/main/default/objects/`):

`Climber__c`:
- `Goal_Grade__c` (Number)
- `Training_Focus__c` (Text) — e.g. "overhang volume", "grade projection"
- `Coach_Notes__c` (Long Text)
- `Assessment_Date__c` (Date)
- `Smear_User_Id__c` (Text) — links to Supabase user ID for GraphQL lookup

`ClimbSession__c`:
- `Climber__c` (Lookup)
- `Session_Date__c` (Date)
- `Working_Grade__c` (Number)
- `Session_Type__c` (Picklist: "coached", "open", "assessment")
- `Coach_Observations__c` (Long Text)

**Apex classes** (`salesforce/force-app/main/default/classes/`):
- `GetClimberSessions.cls` — `@InvocableMethod`, queries `ClimbSession__c` for a Climber. Bulkified.
- `ComputeGradeTrend.cls` — `@InvocableMethod`, weighted average of recent `Working_Grade__c`. Bulkified.

---

## File locations

```
Smear/
├── backend/
│   ├── requirements.txt                    ← add strawberry-graphql + anthropic
│   └── app/
│       ├── main.py                         ← mount GraphQL + coaching routers
│       ├── gyms.py                         ← get_supabase() lives here
│       ├── session_insights.py             ← reuse _working_grade() logic in resolvers
│       └── routers/
│           ├── sessions.py                 ← add cache invalidation on session close
│           ├── graphql_router.py           ← CREATE: GraphQL schema + resolvers
│           └── coaching.py                 ← CREATE: 4 coaching endpoints
├── frontend/
│   └── src/
│       ├── features/stats/
│       │   └── pages/StatsOverviewPage.tsx ← no change needed
│       └── features/coaching/              ← CREATE this feature directory
│           ├── components/
│           │   └── CoachingStatusCard.tsx  ← home screen card
│           └── pages/
│               └── CoachingDetailPage.tsx  ← /coaching route
├── supabase/
│   └── migrations/
│       └── YYYYMMDD_create_coaching_insights.sql  ← CREATE
└── salesforce/                             ← CREATE
    └── force-app/main/default/
        ├── classes/
        │   ├── GetClimberSessions.cls
        │   ├── GetClimberSessions.cls-meta.xml
        │   ├── ComputeGradeTrend.cls
        │   └── ComputeGradeTrend.cls-meta.xml
        └── objects/
            ├── Climber__c/
            └── ClimbSession__c/
```

---

## Key constraints

- Do not break existing gym endpoints — add to FastAPI, don't restructure
- Use `get_supabase()` from `backend/app/gyms.py` — do not create a new Supabase client
- Coaching layer is read-only — never writes to `climbs` or `sessions` tables
- Always check `coaching_insights` cache before calling Claude API
- Use `claude-haiku-4-5-20251001` with prompt caching on the system prompt block
- Bulkify all Apex — no SOQL inside loops
- Coaching surface is non-critical — hide on error, never block any existing screen

---

## Supabase migration for coaching_insights

```sql
create table coaching_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null check (insight_type in ('pre-session', 'post-session', 'training-focus')),
  insight_text text not null,
  generated_at timestamptz not null default now(),
  is_valid boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index on coaching_insights(user_id, insight_type) where is_valid = true;
create index on coaching_insights(user_id, insight_type, is_valid);
```

---

## Estimated costs at 100 active users

| Item | Cost/month |
|---|---|
| Claude Haiku (coaching generation, ~12 calls/user/month) | ~$1 |
| Prompt cache hits (~90% hit rate) | −$0.90 |
| Render (existing, no change) | $0–$7 |
| Supabase (trivial new table) | $0 |
| Salesforce Dev org | $0 (free forever) |
| **Total new spend** | **~$0.10–$1** |

---

## Build sequence

| Days | Task |
|---|---|
| Weekend | Trailhead: Apex Basics, Agentforce, Einstein Copilot. Dev org + custom objects. |
| Mon–Tue W1 | Apex InvocableMethod classes + seed data |
| Wed–Thu W1 | GraphQL layer (Phase 1) |
| Fri W1 | Coaching endpoints + Haiku integration (Phase 2) |
| Mon–Tue W2 | Agentforce agent — External Service + Topics + system prompt (Phase 4) |
| Wed W2 | Frontend coaching card + detail screen (Phase 3) |
| Thu W2 | Loom demo + `/salesforce` README |
| Fri W2 | Interview prep |

---

## Interview context

Role: Salesforce AI Builder, Emerging Talent (JR341276)

Key probe areas:
- Agentic reasoning design: why two Topics — different data owners (gym CRM vs. climber app), not just different storage
- GraphQL as architecture: one endpoint, three consumers (frontend, coaching endpoints, Salesforce External Service)
- Model selection: chose Haiku over Sonnet — structured generation task, prompt caching, same SDK. Cost-conscious without sacrificing quality.
- Engineering ownership with AI tooling: Claude Code story, reviewed every output
- Customer-facing: PING algorithm selected over senior engineers, shipped to production fitters
- Travel: 25-50% is real, have a genuine answer ready
