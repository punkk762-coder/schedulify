# Personal Routine OS — Product Requirements Document

## 1. Product Overview

Personal Routine OS is a private, two-user, natural-language-first routine and habit tracking application.

It is designed primarily for:
- The user: tracking routines, meals, habits, completion, history, nutrition, analytics, and interacting with the system through natural-language chat.
- The user's mother: viewing what needs to be prepared for the day, especially meals.

The product must not force the user to manually create conventional "habits." The user should be able to paste a complete routine/meal plan or describe changes conversationally. Gemini interprets the request and converts it into validated structured data and actions.

### Core principle

> The user describes what they want in normal language; the system identifies what should be stored, scheduled, tracked, changed, or analyzed.

---

## 2. Goals

### Primary goals

1. Provide a simple daily checklist for the user's routine.
2. Allow the user to record completion by:
   - ticking an item;
   - chatting naturally with the AI.
3. Parse complete plans pasted into the application.
4. Infer recurring schedules, dates, alternatives, quantities, macros, meals, and reminders.
5. Preserve historical truth: changing a future routine must never rewrite historical records.
6. Provide a simple "Mom's Kitchen" view showing what needs to be prepared.
7. Provide historical analytics and natural-language querying over the user's actual data.
8. Provide reminders/notifications for scheduled items.
9. Work well as an installable Android PWA.
10. Keep the architecture extensible for a future native Android shell if guaranteed local alarms become necessary.

### Secondary goals

- Support multiple routines/plans over time.
- Support plan versioning.
- Support alternatives/substitutions.
- Support nutrition tracking.
- Support streaks and adherence analytics.
- Make AI actions auditable and reversible.

---

## 3. Non-Goals for V1

- Public user registration.
- Social features.
- Payments/subscriptions.
- Multi-family tenancy.
- Complex RBAC.
- Full medical/nutrition advice engine.
- Automatic health diagnosis.
- Native Android application in the first web-first release.
- Google Calendar as the source of truth.
- Manual CRUD-heavy habit management as the primary UX.

---

## 4. Users

### User role

The primary user can:
- view today's plan;
- complete/skip items;
- chat with the AI;
- create/change routines through chat;
- paste/import plans;
- view history;
- view nutrition;
- view analytics;
- manage reminders;
- manage plans and future changes.

### Mom role

The mom can:
- open the application;
- see today's meal/preparation requirements;
- see meal times;
- see ingredients/quantities when available;
- optionally mark preparation as done if enabled later.

The mom does not need access to private analytics or the full AI control system.

---

## 5. Authentication

V1 authentication is intentionally simple.

- Two roles: `USER` and `MOM`.
- Login uses PIN only.
- PINs are configured through environment variables.
- PINs are never stored in plaintext in the database.
- Successful authentication creates a secure HTTP-only session cookie.
- The browser never receives the configured PIN.
- Server-side authorization determines role.

Environment variables:

```env
USER_PIN=...
MOM_PIN=...
SESSION_SECRET=...
```

This is appropriate for a private personal application and is intentionally not designed as public consumer authentication.

---

## 6. Core Product Concepts

### Plan

A named collection of routines, meals, habits, schedules, targets, and rules.

Examples:
- October Nutrition Plan
- Morning Routine
- Gym Routine
- IELTS Routine

### Routine item

A trackable activity such as:
- workout;
- meal;
- walk;
- water;
- supplement;
- bedtime shake;
- meditation.

### Schedule

Defines when and how often a routine item is expected.

Examples:
- daily at 10:15;
- weekdays at 8 PM;
- every Sunday;
- one-time tomorrow at 5:30 PM.

### Alternative

Defines substitution relationships.

Example:

> "I will have protein oats every morning, but whey can be an alternative."

The system should store:
- primary item;
- alternative item;
- scope;
- start date;
- conditions if provided.

### Occurrence

A concrete expected instance of a scheduled item for a specific date/time.

Historical tracking happens against occurrences, not mutable templates.

### Completion

An actual user event:
- completed;
- skipped;
- missed;
- partially completed;
- replaced by an alternative.

### Nutrition snapshot

Calories, protein, carbohydrates, fats, fiber, and other values associated with a planned or consumed meal.

---

## 7. Core User Journeys

### Journey A — Initial plan import

1. User opens AI Chat.
2. User pastes a complete plan.
3. Gemini analyzes it.
4. Gemini returns structured proposed changes.
5. Backend validates the proposal.
6. User sees an import/review summary.
7. User confirms.
8. Backend creates plan/routine/schedule/meal/alternative records.
9. Future occurrences are generated.
10. Reminders are scheduled where applicable.

The system must never blindly write arbitrary LLM output into the database.

### Journey B — Natural-language completion

User:

> "I had whey instead of the oats today."

System:
1. resolves today's date;
2. identifies the breakfast occurrence;
3. identifies whey as the alternative;
4. records oats as replaced/not consumed;
5. records whey as consumed;
6. updates nutrition;
7. responds with a concise confirmation.

### Journey C — Future routine change

User:

> "From tomorrow, I'm going to have eggs instead of chana in the evening."

System:
1. understands "tomorrow";
2. identifies the existing recurring chana schedule;
3. creates a future schedule version/change;
4. preserves all historical chana occurrences;
5. generates future egg occurrences;
6. updates future analytics expectations.

### Journey D — Historical question

User:

> "What did I have last Tuesday?"

AI:
1. queries actual historical occurrence/completion data;
2. returns only data that exists;
3. distinguishes planned vs actually consumed.

### Journey E — Mom view

Mom opens the app:
1. authentication;
2. today's kitchen view;
3. meal timeline;
4. ingredients/quantities;
5. optional notes.

---

## 8. Plan Import Intelligence

The importer should identify, where possible:

- plan name;
- dates;
- weekdays;
- times;
- recurring schedules;
- meals;
- meal components;
- quantities;
- calories;
- protein;
- carbs;
- fats;
- fiber;
- supplements;
- activities;
- reminders;
- alternatives;
- exclusions;
- conditions;
- notes;
- meal-preparation instructions.

The importer must preserve uncertainty.

If Gemini cannot confidently infer something, the system should produce a review question rather than inventing a value.

---

## 9. Natural Language Assistant

The assistant supports:

### Tracking

- "I finished my workout."
- "I had lunch."
- "I skipped chana."
- "I had whey instead."

### Planning

- "Add a 20-minute walk every evening."
- "From Monday, make this my breakfast."
- "Remove the bedtime shake for this week."

### Schedule

- "Move today's walk to 8:30."
- "Remind me 10 minutes before my workout."

### History

- "What did I miss this week?"
- "How much protein did I average last week?"
- "Show me my last five missed walks."

### Analytics

- "How consistent was I this month?"
- "What is my average calorie intake?"
- "Which routine items do I miss most?"

### Natural-language correction

- "Actually, I did have the chana yesterday."

The system should modify the appropriate historical occurrence after confirming date/entity resolution.

---

## 10. Notifications

V1 target:
- installable PWA;
- browser push notifications where supported;
- reminder scheduling through a server-side notification job;
- user-controlled reminder offsets.

Important constraint:

A PWA cannot guarantee native Android alarm-clock semantics in every device/browser state.

Therefore:
- web notifications are the V1 mechanism;
- notification architecture is abstracted;
- a future Capacitor Android shell can implement exact local alarms without changing the domain model.

---

## 11. Analytics

### Daily

- completion percentage;
- planned vs completed;
- skipped/missed items;
- calorie intake;
- protein;
- carbs;
- fats;
- fiber when available.

### Weekly

- adherence;
- streaks;
- completion by category;
- nutrition averages;
- missed-item ranking;
- schedule reliability.

### Monthly

- adherence trend;
- nutrition trend;
- habit consistency;
- strongest/weakest routines;
- plan changes;
- completion heatmap.

### AI analytics

The AI can answer questions from stored analytics but must query the database instead of inventing statistics.

---

## 12. Acceptance Criteria

The V1 is successful when:

- User can log in with a PIN.
- Mom can log in separately.
- User can see today's schedule.
- Mom can see today's meals.
- User can tick an item complete.
- User can tell AI they completed/skipped/replaced an item.
- User can paste a full routine and receive a structured import proposal.
- User can approve the proposal.
- Recurring items generate future occurrences.
- Future changes do not alter historical data.
- Alternatives are tracked correctly.
- Nutrition values can be tracked.
- Historical data is queryable.
- Analytics are calculated from actual stored events.
- Reminder records are created from schedules.
- PWA can be installed on Android.
- Gemini API keys remain server-side.
