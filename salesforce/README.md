# Smear × Salesforce Agentforce

An AI climbing coach built on Salesforce Agentforce. The agent talks directly to climbers — it reads their performance data from the Smear app and their coaching context (goals, training focus) from Salesforce, then synthesizes personalized advice.

A climber asks *"What should I work on today?"* — the agent fetches their current working grade and trend from GraphQL (Topic 1) and their goal grade and training focus from Salesforce (Topic 2), then gives a specific answer.

---

## Why two topics

Different data, different trust boundaries:

| | Topic 1 (GraphQL) | Topic 2 (Apex) |
|---|---|---|
| **Owner** | Climber (self-reported) | Coaching layer (goal + agent-set focus) |
| **Storage** | Supabase via Smear app | Salesforce CRM |
| **Examples** | Working grade, send rate, flash rate, trend | Goal grade, training focus |
| **Trust** | What the athlete actually logged | What the climber is working toward |

One topic per data owner — not per storage system.

---

## Custom objects

### `Climber__c`
Represents a climber's coaching context. Links to their Smear app account via `Smear_User_Id__c`.

| Field | Type | Description |
|---|---|---|
| `Goal_Grade__c` | Number | Target V-scale value (VB=−1, V0=0 … V10+=11). Set by the climber via agent chat. |
| `Training_Focus__c` | Text(255) | Agent-set focus area e.g. "overhang volume", "grade projection" |
| `Smear_User_Id__c` | Text(36), External ID | Supabase UUID for GraphQL lookups |

---

## Apex classes

### `GetClimberGoal`
`@InvocableMethod` — reads `Goal_Grade__c` and `Training_Focus__c` from `Climber__c` by `Smear_User_Id__c`. Returns `found: false` if no record exists yet (new climber, no goal set).

### `UpsertClimberGoal`
`@InvocableMethod` — creates or updates a `Climber__c` record by `Smear_User_Id__c`. Used when a climber sets their goal via chat, or when the agent writes back an updated `Training_Focus__c` after synthesizing performance data.

---

## External Service

`SmearGraphQL` named credential + external service registration points at `https://smear-backend.onrender.com/graphql`. The agent calls this for live climber performance data.

The `/graphql` endpoint requires a `Bearer` JWT. The Named Credential is configured with a service-level token — see Named Credentials in Setup to verify.

Key queries:
- `climberProfile(userId)` — working grade, send rate, flash rate, archetype gaps, plateau weeks
- `recentSessions(userId, limit)` — last N sessions with materialized stats

---

## Dev org setup

```bash
# Install Salesforce CLI
brew install sf

# Authenticate to Dev org
sf org login web --alias smear-dev

# Deploy all metadata
sf project deploy start --manifest package.xml --target-org smear-dev

# Assign permission set
sf org assign permset --name SmearCoaching --target-org smear-dev

# Open org
sf org open --target-org smear-dev
```

After deploy:
1. **Setup → Security → Named Credentials → `SmearGraphQL`** — set Auth type to `Custom Header`, header `Authorization`, value `Bearer <service-token>`
2. **Setup → Integrations → External Services → `SmearGraphQL`** — activate, verify `climberProfile` and `recentSessions` operations are visible
3. **Setup → Agent Studio → Agents → New Agent** — add two topics:
   - **Live Performance** — External Service action `executeGraphQL` (Topic 1)
   - **Coaching Context** — Apex actions `GetClimberGoal` and `UpsertClimberGoal` (Topic 2)

---

## Seed data

Create a `Climber__c` record with your Supabase UUID as `Smear_User_Id__c` and a `Goal_Grade__c` value. The Smear UUID is visible in the Supabase dashboard under Auth → Users.

Test prompt: *"What should I work on today?"* or *"I want to set my goal to V6."*
