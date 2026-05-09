# Smear Coaching Agent — Claude Code Context

## What this project is

Extending smear.app with two parallel additions:
1. A live coaching feature shipped inside the Smear app — insight card on the Stats overview page
2. A Salesforce Agentforce integration in a Developer org — wired to the same backend

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
| AI | Anthropic API (not yet wired up — `anthropic` package not yet in `requirements.txt`) |

**Current `backend/requirements.txt`:**
```
fastapi==0.128.8
uvicorn[standard]==0.39.0
httpx==0.28.1
supabase==2.28.1
python-dotenv==1.2.1
```
Both `strawberry-graphql[fastapi]` and `anthropic` need to be added.

**Stats: partially server-side, partially client-side.**

Per-session aggregates are materialized on the server at session close: the `sessions` table stores `total_climbs`, `sends`, `flashes`, `attempts`, `hardest_grade_value`, `top_tags`, plus `insight_label`/`insight_reason`/`insight_classifier_version` (written by `backend/app/session_insights.py`).

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
- `workingGrade`: float (median of top 40% sent grades across all climbs, same formula as `_working_grade()` in `session_insights.py`)
- `sendRate`: float (sent / total climbs)
- `flashRate`: float (flashes / total sent)
- `archetype`: str (dominant tag category across all sends)
- `styleBreakdown`: list of `{tag: str, count: int}`
- `gradePyramid`: list of `{grade: float, sends: int}`
- `sessionsPerWeek`: float (sessions in last 90 days / 13 weeks)
- `avgClimbsPerSession`: float
- `trendDirection`: str ("up" | "flat" | "down") based on comparing last 30 days working grade vs prior 60 days

Data sources per field:
- `sendRate`, `flashRate`, `avgClimbsPerSession`: use materialized `sessions` columns (`sends`, `flashes`, `total_climbs`) — no climbs join needed
- `sessionsPerWeek`: count of published sessions in last 90 days / 13 weeks
- `workingGrade`, `trendDirection`, `gradePyramid`: query `climbs` table (needs `gym_grade_value` + `send_type` per climb)
- `styleBreakdown`, `archetype`: use `top_tags` from `sessions` or `tags` from `climbs`

All via `get_supabase()`. No new DB tables for this query.

`recentSessions(userId: str, limit: int = 10)` — returns recent sessions with:
- `id`, `startedAt`, `gymName` (join via user's gym preference), `totalClimbs`, `durationMinutes`, `workingGrade`, `insightLabel`

Resolvers call Supabase directly — no HTTP round-trip.

### Phase 2 — Coaching endpoint

`GET /api/v1/coach/insight` in FastAPI (authenticated — user ID from JWT via `get_current_user` dep, no request body needed).

Logic:
1. Check `coaching_insights` table for a valid cached row: `user_id = {uid}` AND `is_valid = true`. If found, return it immediately.
2. If no valid cache: call `climberProfile` resolver logic directly (no HTTP round-trip) to build the stats payload.
3. Pass stats to Claude API (`claude-sonnet-4-20250514` or latest Sonnet). System prompt: climbing performance coach persona, 2-3 sentence insight + one specific drill. Direct tone, reference actual numbers, not a cheerleader.
4. Write result to `coaching_insights`: `(user_id, insight_text, generated_at, is_valid=true)`.
5. Return `{insight: str, generated_at: str (ISO timestamp)}`.

**Cache invalidation:** in `backend/app/routers/sessions.py`, when a session is published (session close), set `is_valid = false` on any `coaching_insights` row for that `user_id`.

### Phase 3 — Frontend coaching card

Add a standalone `CoachingInsightCard` component to the Stats overview page. This is **not** a `StatsPreviewCard` (those are navigation cards linking to sub-pages) — it's an inline card with text.

**Where to add it:** `frontend/src/features/stats/pages/StatsOverviewPage.tsx`, after the existing stats cards section.

**Component:** `frontend/src/features/stats/components/CoachingInsightCard.tsx`
- Fetches from `GET /api/v1/coach/insight` (authenticated)
- Skeleton loader while loading
- Shows insight text + "Updated {relative time}" footer
- Accent color: `ember` (matches Progression/Archetype card tone — Tailwind class `text-ember`, `border-ember/20`)
- Error state: hide card silently (non-critical feature)

**The existing `statsCards` config** (`frontend/src/features/stats/config/statsCards.ts`) does not need to change. Current card order: Progression → Archetype → Performance → Sessions. The coaching card renders separately below (or above) this list.

### Phase 4 — Salesforce Dev org (separate from production, no production impact)

Create `salesforce/` directory at repo root.

**Custom objects:** `Climber__c`, `ClimbSession__c`

**Apex classes** (`salesforce/force-app/main/default/classes/`):
- `GetClimberSessions.cls` — `@InvocableMethod`, queries `ClimbSession__c` for a given Climber. Bulkified (no SOQL in loops).
- `ComputeGradeTrend.cls` — `@InvocableMethod`, weighted average of recent `WorkingGrade__c` values. Bulkified.

**Agentforce agent:**
- Topic 1: calls GraphQL External Service (Render `/graphql` endpoint) for live Supabase stats
- Topic 2: calls `ComputeGradeTrend` Apex Action for Salesforce-stored data
- System prompt: agent decides which tool to use based on query type (live vs. historical)

---

## File locations

```
smear-app/Smear/
├── backend/
│   ├── requirements.txt            ← add strawberry-graphql + anthropic
│   └── app/
│       ├── main.py                 ← mount GraphQL router + coaching router
│       ├── gyms.py                 ← get_supabase() lives here
│       ├── session_insights.py     ← reuse _working_grade() logic in resolvers
│       └── routers/
│           ├── sessions.py         ← add cache invalidation on session close
│           ├── graphql_router.py   ← CREATE: GraphQL schema + resolvers
│           └── coaching.py         ← CREATE: GET /api/v1/coach/insight
├── frontend/
│   └── src/features/stats/
│       ├── pages/StatsOverviewPage.tsx         ← add CoachingInsightCard here
│       └── components/CoachingInsightCard.tsx  ← CREATE
├── supabase/
│   └── migrations/
│       └── YYYYMMDD_create_coaching_insights.sql  ← CREATE
└── salesforce/                     ← CREATE this directory
    └── force-app/main/default/
        ├── classes/
        │   ├── GetClimberSessions.cls
        │   └── ComputeGradeTrend.cls
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
- Bulkify all Apex — no SOQL inside loops
- The `CoachingInsightCard` is non-critical — hide on error, never block the Stats page

---

## Supabase migration for coaching_insights

```sql
create table coaching_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_text text not null,
  generated_at timestamptz not null default now(),
  is_valid boolean not null default true,
  created_at timestamptz not null default now()
);

create index on coaching_insights(user_id, is_valid);
```

---

## Build sequence

| Days | Task |
|---|---|
| Weekend | Trailhead: Apex Basics, Agentforce, Einstein Copilot. Dev org + custom objects. |
| Mon–Tue W1 | Apex InvocableMethod classes + seed data |
| Wed–Thu W1 | GraphQL layer (Phase 1) |
| Fri W1 | Coaching endpoint + Claude API (Phase 2) |
| Mon–Tue W2 | Agentforce agent — External Service + Topics + system prompt (Phase 4) |
| Wed W2 | Smear coaching card (Phase 3) |
| Thu W2 | Loom demo + /salesforce README |
| Fri W2 | Interview prep |

---

## Interview context

Role: Salesforce AI Builder, Emerging Talent (JR341276)

Key probe areas:
- Agentic reasoning design: why two Topics, how does the agent decide between them (live Supabase data vs. Salesforce-stored historical data)
- GraphQL as architecture: one endpoint, three consumers (frontend, coaching endpoint, Salesforce External Service)
- Engineering ownership with AI tooling: Claude Code story, reviewed every output
- Customer-facing: PING algorithm selected over senior engineers, shipped to production fitters
- Travel: 25-50% is real, have a genuine answer ready
