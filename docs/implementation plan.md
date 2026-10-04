# Personal Routine OS — Implementation Plan

# Phase 0 — Architecture + Database

### Goal

Lock domain model, repo conventions, and full schema before UI work.

### Deliverables

- Next.js + TypeScript repository;
- Prisma;
- Supabase PostgreSQL;
- environment configuration;
- ESLint/Prettier;
- Zod;
- testing setup;
- basic domain/service structure;
- Prisma models for: plans, routine items, schedules (with effectiveFrom/effectiveUntil), occurrences, completions, alternatives, meals, meal components, nutrition, notifications, conversations, messages, push subscriptions;
- historical immutability enforced at domain layer.

### Exit criteria

- app boots;
- database connects;
- Prisma migration works;
- environment validation works;
- a complete Monday–Sunday routine can be stored and queried;
- changing future schedule preserves past occurrences.

# Phase 1 — Authentication + App Shell

### Build

- PIN login;
- USER/MOM roles;
- secure HTTP-only session;
- authorization middleware;
- user dashboard shell (nav: Today / Chat / Analytics / History / Settings);
- Mom shell (Kitchen view only).

### Exit criteria

- both PINs work;
- role routing works;
- session survives refresh;
- logout works.

---

# Phase 2 — Today + Manual Tracking

### Build

- Today API;
- occurrence cards (timeline grouped by time);
- completion;
- skip;
- replacement;
- nutrition summary;
- history view.

### Exit criteria

The current diet plan can be tracked manually without AI.

# Phase 3 — Mom Kitchen

### Build

- Mom login routing;
- today's meals API;
- meal times;
- quantities;
- preparation notes.

### Exit criteria

Mom can open the app and immediately know what needs to be made today.

---

# Phase 4 — Gemini + Chat + Plan Import

### Build

- Gemini service;
- model routing (fast vs reasoning);
- structured outputs;
- Zod schemas for AI action types;
- conversation storage;
- tool execution layer;
- chat UI;
- plan paste/import;
- import proposal + review UI;
- ambiguity detection;
- transaction-based import.

### First supported intents

```text
COMPLETE
SKIP
REPLACE
RESCHEDULE
QUERY_HISTORY
QUERY_ANALYTICS
CREATE_ROUTINE
UPDATE_ROUTINE
IMPORT
ASK_CLARIFICATION
```

### Test against

The provided Monday–Sunday nutrition plan.

### Exit criteria

- User can perform tracking operations through chat.
- User can paste a plan, review parsed output, confirm import.
- System correctly detects meals, times, recurrence, macros, alternatives.

---

# Phase 5 — Scheduling Engine

### Build

- recurrence rules;
- effectiveFrom/effectiveUntil on schedules;
- occurrence generation (rolling horizon);
- future-only modifications;
- timezone handling (UTC storage, Asia/Kolkata recurrence);
- reminder generation.

### Exit criteria

User can say "From tomorrow, replace chana with eggs" and only future occurrences change.

---

# Phase 6 — PWA + Notifications

### Build

- manifest;
- service worker;
- installable Android experience;
- push subscription;
- notification permission;
- Vercel Cron route for notification dispatch;
- reminder offsets.

### Exit criteria

On a supported Android browser, the installed PWA can receive scheduled notifications.

### Important

Do not claim native alarm reliability from the PWA.

---

# Phase 7 — Analytics

### Build

On-the-fly analytics computed from occurrences/completions:

- daily adherence;
- weekly adherence;
- monthly adherence;
- nutrition averages;
- missed items;
- streaks;
- category breakdown;
- completion trends.

### AI analytics

Add natural-language queries over deterministic metrics.

Gemini identifies the query; SQL computes the answer.

---

# Phase 8 — Production Hardening

### Security

- login rate limiting;
- AI endpoint rate limiting;
- CSRF protections as appropriate;
- secure cookies;
- input validation;
- audit logging.

### Reliability

- cron job retries;
- idempotency keys;
- failed notification recovery;
- Gemini timeout handling;
- fallback response when AI is unavailable.

### Testing

- unit;
- integration;
- E2E;
- migration tests;
- AI fixture tests.

---

# Future Phases (Post-V1)

- Voice input (browser speech recognition → existing chat pipeline)
- Native Android via Capacitor (only if PWA notifications insufficient)
- Weight/sleep/water/mood tracking
- Custom metrics + correlations

---

Do not start with AI. The core tracker must work without AI.

### V1 = Phases 0–8

```text
0. Architecture + Database
1. Authentication + App Shell
2. Today + Manual Tracking
3. Mom Kitchen
4. Gemini + Chat + Plan Import
5. Scheduling Engine
6. PWA + Notifications
7. Analytics
8. Production Hardening
```

Stitch MCP used during each phase's UI work — not a separate phase.

---

# Definition of Done for V1

A V1 is complete when the user can:

1. Log in with PIN.
2. See today's routine.
3. Tick items.
4. Chat to record what happened.
5. Ask what happened in the past.
6. Ask analytics questions.
7. Paste a complete plan.
8. Review the parsed plan.
9. Import it.
10. Make future changes conversationally.
11. Use alternatives.
12. Preserve historical records.
13. See nutrition.
14. Receive reminders.
15. Install the app on Android.
16. Let Mom see today's kitchen requirements.

The product should feel like:

> "I tell my routine app what I'm doing, and it keeps the system organized for me."

rather than:

> "I maintain a complicated habit-tracking database."
