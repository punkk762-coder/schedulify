# Personal Routine OS — Application Flow

## 1. High-Level Flow

```text
                    ┌───────────────┐
                    │    PIN Login  │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
              USER                    MOM
                 │                     │
        ┌────────┼────────┐            │
        ▼        ▼        ▼            ▼
      Today     Chat   Analytics    Kitchen
        │        │        │            │
        │        ▼        │            │
        │    Gemini AI    │            │
        │        │        │            │
        └────────┴────────┴────────────┘
                         │
                    Domain Layer
                         │
                    PostgreSQL
```

---

## 2. First Login

```text
Open app
  ↓
PIN screen
  ↓
Enter PIN
  ↓
Server validates PIN
  ↓
Create secure session
  ↓
Determine role
  ↓
USER → Today
MOM  → Kitchen
```

---

## 3. User Today Flow

```text
Today
 │
 ├── Date
 ├── Completion percentage
 ├── Timeline
 │    ├── completed
 │    ├── pending
 │    ├── skipped
 │    └── missed
 │
 ├── Nutrition summary
 │
 └── Quick actions
      ├── Complete
      ├── Skip
      └── Chat
```

Ticking an item:

```text
Tap checkbox
  ↓
POST completion
  ↓
Transaction
  ↓
Occurrence status = COMPLETED
  ↓
Analytics event
  ↓
UI updates
```

---

## 4. AI Chat Flow

```text
User types/speaks
       ↓
POST /api/chat
       ↓
Load:
- current date
- timezone
- today's occurrences
- relevant history
- active plan
- recent conversation
       ↓
Gemini
       ↓
Structured intent/action
       ↓
Zod validation
       ↓
Domain validation
       ↓
Execute transaction
       ↓
Return result
       ↓
Chat response
```

---

## 5. Natural Completion

Input:

> "I finished my walk."

```text
Resolve date = today
Resolve routine = Walk
Resolve occurrence
      ↓
Complete occurrence
      ↓
Create analytics event
      ↓
Return confirmation
```

---

## 6. Alternative Completion

Input:

> "I had whey instead of the oats."

```text
Find today's breakfast
       ↓
Find oats primary
       ↓
Find whey alternative
       ↓
Record oats = REPLACED
Record whey = COMPLETED
       ↓
Nutrition actuals update
       ↓
Analytics event
```

---

## 7. Future Change

Input:

> "From tomorrow I'll have eggs instead of chana."

```text
Resolve "tomorrow"
       ↓
Find recurring chana schedule
       ↓
Create schedule version
       ↓
End old schedule version today
       ↓
Create egg schedule from tomorrow
       ↓
Preserve old occurrences
       ↓
Generate future occurrences
       ↓
Update future notifications
```

---

## 8. Full Plan Import

```text
Paste plan
    ↓
AI parser
    ↓
PlanImportProposal
    │
    ├── detected items
    ├── detected schedules
    ├── detected nutrition
    ├── alternatives
    ├── reminders
    ├── ambiguities
    └── warnings
    ↓
Review
    ↓
Confirm
    ↓
Transaction
    ↓
Plan + schedules + meals + alternatives
    ↓
Generate future occurrences
    ↓
Generate notifications
```

---

## 9. History Flow

```text
History
  ↓
Select date/range
  ↓
Query occurrences + completions
  ↓
Show:
- planned
- completed
- skipped
- missed
- replaced
- actual nutrition
```

AI can provide a natural-language interface over this same data.

---

## 10. Analytics Flow

```text
Raw completion events
        ↓
SQL aggregation
        ↓
Daily metrics
        ↓
Weekly metrics
        ↓
Monthly metrics
        ↓
Charts/cards
        ↓
AI analytics questions
```

Example:

> "How consistent was I this month?"

```text
AI identifies analytics query
       ↓
SQL/service computes metric
       ↓
AI formats result
```

---

## 11. Mom Flow

```text
Mom login
   ↓
Today's Kitchen
   ↓
Meal timeline
   ↓
For each meal:
- time
- meal name
- ingredients
- quantities
- notes
```

No analytics clutter.

---

## 12. Notification Flow

```text
Schedule created
      ↓
Reminder offset resolved
      ↓
Notification record
      ↓
Vercel Cron checks pending notifications
      ↓
Web Push
      ↓
Android notification
      ↓
User taps / dismisses
```

For future native Android support, the same notification intent can be handed to native alarm APIs.

---

## 13. Error Flow

If Gemini is uncertain:

```text
User request
  ↓
AI uncertainty
  ↓
ASK_CLARIFICATION
  ↓
User answers
  ↓
Retry action
```

Never invent critical dates, quantities, meal substitutions, or schedule scope.

If the AI fails completely:

```text
AI unavailable
  ↓
Show simple message
  ↓
Manual checkbox actions remain usable
```

The application must remain useful without AI.

---

## 14. Core State Model

Each occurrence should have one primary state:

```text
PENDING
COMPLETED
SKIPPED
MISSED
REPLACED
PARTIAL
```

Actual consumed item can be separate from planned item.

This prevents ambiguity such as:

> planned oats, consumed whey.

---

## 15. Plan Lifecycle

```text
DRAFT
  ↓
REVIEW
  ↓
ACTIVE
  ↓
PAUSED / SUPERSEDED
  ↓
ARCHIVED
```

Only one or more plans can be active depending on category.

For V1, a routine can belong to one active plan while historical versions remain preserved.
