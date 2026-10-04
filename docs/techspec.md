# Personal Routine OS — Technical Specification

## 1. Technology Decisions

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| UI implementation | Stitch MCP |
| Styling/UI primitives | Tailwind CSS + chosen Stitch output |
| App type | PWA |
| Backend | Next.js Route Handlers / Server Actions |
| Background jobs | Vercel Cron |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| AI | Gemini API |
| AI SDK | Official Google GenAI SDK for TypeScript |
| Validation | Zod |
| Authentication | PIN + secure HTTP-only session cookie |
| Background jobs | Vercel Cron + API route handlers |
| Deployment | Vercel + Supabase |
| Analytics | PostgreSQL event/aggregation layer |
| Testing | Vitest + Playwright |
| PWA | Web App Manifest + Service Worker |
| Notifications | Web Push / Notification API where supported |
| Future Android native bridge | Capacitor |

---

## 2. Repository Structure

```text
schedulfy/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   │   ├── today/
│   │   ├── chat/
│   │   ├── analytics/
│   │   ├── history/
│   │   └── settings/
│   ├── mom/
│   ├── api/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── plans/
│   │   ├── occurrences/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── cron/
│   ├── manifest.ts
│   └── layout.tsx
├── components/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── ai/
│   ├── domain/
│   ├── notifications/
│   ├── analytics/
│   ├── dates/
│   └── validation/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── icons/
│   └── sw.js
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
└── package.json
```

---

## 3. Environment Variables

```env
# Database
DATABASE_URL=
DIRECT_URL=

# Authentication
USER_PIN=
MOM_PIN=
SESSION_SECRET=

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL_FAST=gemini-2.5-flash-lite
GEMINI_MODEL_REASONING=gemini-2.5-flash

# Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Application
NEXT_PUBLIC_APP_URL=
APP_TIMEZONE=Asia/Kolkata

# Vercel Cron (secured by CRON_SECRET)
CRON_SECRET=
```

Do not expose `GEMINI_API_KEY`, PINs, session secrets, database URLs, or VAPID private keys through `NEXT_PUBLIC_*` variables.

---

## 4. Database Model

Core entities:

```text
User
Session
Plan
RoutineItem
Schedule          (effectiveFrom / effectiveUntil for versioning)
Occurrence
Completion
Alternative
Meal
MealComponent
NutritionSnapshot
Conversation
Message           (user + AI messages + embedded action JSON)
Notification
PushSubscription
```

> V1 simplification: PlanVersion/ScheduleVersion collapsed into effective date ranges on Schedule. AnalyticsEvent/DailyMetric deferred — analytics computed on-the-fly from occurrences/completions. Separate AIAction table deferred — actions stored as JSON in Message.

### Important relationships

```text
Plan
 └── RoutineItem
      ├── Schedule (effectiveFrom/effectiveUntil)
      │    └── Occurrence
      │         └── Completion
      ├── Meal
      └── Alternative ──> RoutineItem
```

---

## 5. Historical Immutability

Templates are mutable.

Occurrences are historical facts.

Example:

```text
Routine:
  Evening Snack

Oct 1 occurrence:
  Chana
  COMPLETED

Oct 2 occurrence:
  Chana
  SKIPPED

Oct 3 occurrence:
  Chana
  REPLACED_BY_WHEY

Oct 4 onward:
  Eggs
```

Changing the future routine must never rewrite Oct 1–3.

---

## 6. AI Architecture

Gemini is not allowed to directly mutate the database.

Flow:

```text
User message
    ↓
Conversation service
    ↓
Gemini
    ↓
Structured AI response
    ↓
Zod validation
    ↓
Permission/domain validation
    ↓
Application command
    ↓
Database transaction
    ↓
Audit record
    ↓
User response
```

### AI output categories

```text
ANSWER
CREATE
UPDATE
COMPLETE
SKIP
REPLACE
RESCHEDULE
DELETE
QUERY
IMPORT
ASK_CLARIFICATION
```

### Example structured action

```json
{
  "intent": "REPLACE",
  "effectiveDate": "2026-10-05",
  "target": {
    "type": "routine_item",
    "name": "Kala Chana"
  },
  "replacement": {
    "type": "routine_item",
    "name": "Eggs"
  },
  "scope": "FUTURE_OCCURRENCES"
}
```

The backend resolves IDs and performs the mutation.

---

## 7. Gemini Model Strategy

Use a low-cost/fast Flash-family model for normal conversational commands and a stronger Flash-family model for complex plan parsing or ambiguous reasoning.

The exact model names remain environment-configurable rather than hard-coded throughout the application.

At the time of this specification, Google's pricing documentation lists free access for selected Gemini models and specifically lists Gemini 2.5 Flash and Gemini 2.5 Flash-Lite with free-tier availability. Quotas vary by model/project and should be checked in AI Studio before production use. citeturn0search0turn0search1

Recommended initial configuration:

```env
GEMINI_MODEL_FAST=gemini-2.5-flash-lite
GEMINI_MODEL_REASONING=gemini-2.5-flash
```

Do not assume a permanent "millions of tokens per day" free allowance. Treat free quotas as provider limits that can change.

---

## 8. Gemini Tool/Function Boundary

Application tools exposed conceptually to Gemini:

```text
get_today
get_schedule
get_occurrences
get_history
get_nutrition
get_analytics
create_routine
update_routine
complete_occurrence
skip_occurrence
replace_occurrence
reschedule_occurrence
create_plan
import_plan
create_reminder
```

The model proposes tool calls; application code validates and executes them.

---

## 9. Plan Parser

Input:

```text
raw user text
```

Output:

```text
PlanImportProposal
├── plans
├── routineItems
├── schedules
├── meals
├── nutrition
├── alternatives
├── reminders
├── assumptions
├── ambiguities
└── warnings
```

Never silently infer medically significant values or quantities.

---

## 10. Schedule Engine

The schedule engine creates occurrences from recurring schedules.

Recommended strategy:
- store recurrence rules;
- generate occurrences for a rolling horizon;
- regenerate future occurrences when a schedule version changes;
- never regenerate completed historical occurrences.

Timezone:
- default `Asia/Kolkata`;
- store timestamps in UTC;
- preserve user's configured timezone for recurrence calculations.

---

## 11. Notification Architecture

### V1

```text
Schedule
  ↓
Notification record
  ↓
Vercel Cron (checks pending notifications every minute)
  ↓
Web Push
  ↓
Android browser/PWA notification
```

The browser must grant notification permission.

Vercel Cron routes are secured with `CRON_SECRET` header validation.

### Native upgrade

If guaranteed alarm behavior is required:

```text
Next.js PWA
   +
Capacitor Android shell
   ↓
Native AlarmManager / notification APIs
```

The domain/schedule database does not change.

---

## 12. API Design

### Auth

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Today

```text
GET /api/today
POST /api/occurrences/:id/complete
POST /api/occurrences/:id/skip
POST /api/occurrences/:id/replace
```

### Chat

```text
POST /api/chat
GET  /api/chat/conversations
GET  /api/chat/conversations/:id
```

### Plans

```text
POST /api/plans/import
GET  /api/plans
GET  /api/plans/:id
POST /api/plans/:id/activate
```

### Analytics

```text
GET /api/analytics/daily
GET /api/analytics/weekly
GET /api/analytics/monthly
POST /api/analytics/query
```

### Notifications

```text
POST /api/notifications/subscription
DELETE /api/notifications/subscription
GET /api/notifications
```

---

## 13. Security

- PIN authentication only.
- Secure HTTP-only cookie.
- `SameSite=Lax` or `Strict`.
- HTTPS in production.
- Server-side role checks.
- Gemini API key server-side only.
- Validate all AI-generated arguments with Zod.
- Never trust client-provided role.
- Rate-limit login.
- Rate-limit AI endpoints.
- Log AI actions.
- Make destructive AI actions confirmation-based.
- Use transactions for multi-record changes.

---

## 14. Analytics Architecture

V1: Compute all analytics on-the-fly from `Occurrence` + `Completion` tables using SQL aggregation.

No separate event-sourcing table needed for 2 users.

If performance becomes a concern later, introduce materialized `DailyMetric` / `AnalyticsEvent` tables.

Do not ask Gemini to calculate raw metrics when SQL can calculate them deterministically.

---

## 15. Testing

### Unit

- date resolution;
- recurrence;
- alternative resolution;
- nutrition calculations;
- plan diffing;
- AI action validation.

### Integration

- AI proposal → validation → DB transaction;
- future schedule change;
- historical immutability;
- notification creation.

### E2E

- PIN login;
- today's checklist;
- chat completion;
- plan import;
- mom view;
- analytics;
- PWA installation flow where testable.

---

## 16. Deployment

### Vercel

Deploy:
- Next.js app;
- API routes;
- server actions;
- Cron jobs (occurrence generation, notification dispatch, analytics).

### Supabase

Use:
- PostgreSQL;
- database backups;
- database dashboard.

> V1 note: No separate Render worker. Vercel Cron handles all background jobs for 2 users.

### CI

GitHub Actions:
- lint;
- typecheck;
- unit tests;
- Prisma validation;
- E2E smoke tests.

---

## 17. Operational Principle

The AI is an interpreter/controller.

The database is the source of truth.

The application domain layer is the authority.

The UI is a visualization/control surface.

Stitch generates the visual layer; it must not define business rules or database behavior.
