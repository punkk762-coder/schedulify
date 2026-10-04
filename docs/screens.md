# Personal Routine OS — Screen Specification for Stitch MCP

## 1. Stitch Responsibility

Stitch MCP is responsible for producing the UI/visual implementation.

Stitch must NOT invent:
- database models;
- API contracts;
- business rules;
- AI behavior;
- recurrence logic;
- analytics formulas;
- authorization rules.

This document defines the screen requirements Stitch should implement.

---

## 2. Design Direction

The application should feel like a calm personal operating system rather than a corporate productivity dashboard.

Principles:
- mobile-first;
- excellent Android experience;
- PWA-friendly;
- fast;
- low visual clutter;
- large touch targets;
- clear completion states;
- conversational;
- data-dense only where useful;
- Mom view extremely simple.

---

## 3. Authentication Screen

### Screen: PIN Login

Components:
- app logo/name;
- PIN keypad or numeric input;
- hidden PIN characters;
- submit;
- error state;
- loading state.

Do not expose whether the entered PIN corresponds to the user or mom.

---

## 4. User Today Screen

### Header

- greeting;
- date;
- completion percentage;
- profile/role indicator.

### Main

Timeline grouped by time:

```text
10:15 AM
✓ Chocolate Proats

12:30 PM
✓ Lunch

5:30 PM
○ Kala Chana

7:00 PM
○ Dinner

8:00 PM
○ 1-hour Walk

11:30 PM
○ Bedtime Shake
```

Each card can show:
- title;
- category;
- time;
- completion state;
- nutrition summary if relevant;
- alternative indicator;
- reminder indicator.

### Nutrition card

- calories;
- protein;
- carbs;
- fats;
- optional fiber.

### Floating/primary chat entry

Prominent:

> "Tell me what happened..."

---

## 5. Chat Screen

This is a primary screen.

### Header

- AI assistant name;
- current plan context;
- status.

### Message area

User and assistant messages.

### Composer

- text input;
- send;
- microphone button if voice input is enabled;
- attachment/paste support.

### Action confirmation cards

When AI changes data:

```text
I've understood:

Replace evening chana with eggs
Starting tomorrow
Every day

[Confirm] [Cancel]
```

For low-risk completion:

> "Marked your walk complete."

No unnecessary confirmation.

---

## 6. Plan Import Review Screen

After pasting a large plan:

```text
Import detected

1 active plan
18 routine items
12 schedules
7 meals
4 alternatives
6 reminder rules

Potential ambiguity:
"small bowl rice" has no exact quantity.

[Review ambiguity]
[Import]
[Cancel]
```

Expandable sections:
- routines;
- meals;
- schedules;
- alternatives;
- nutrition;
- reminders.

---

## 7. History Screen

Filters:
- today;
- yesterday;
- week;
- month;
- custom date.

Timeline:

```text
MONDAY
✓ Workout
✓ Breakfast
✕ Chana
✓ Walk

SUNDAY
✓ Workout
↔ Whey instead of oats
✓ Dinner
```

Distinguish:
- planned;
- actual;
- replacement;
- skipped.

---

## 8. Analytics Screen

### Overview

- adherence;
- average calories;
- average protein;
- average carbs;
- average fat;
- streak.

### Charts

- daily completion;
- weekly adherence;
- nutrition trend;
- category completion;
- missed items.

### Insights

Examples:

> "You completed your walk on 6 of the last 7 days."

> "Your average protein was 141g this week."

Insights must be generated from deterministic analytics data.

---

## 9. Mom Kitchen Screen

The simplest screen.

### Header

"Today's Kitchen"

### Meal cards

```text
12:30 PM
LUNCH

2 Phulkas
Cabbage-Capsicum Sabzi
Large Salad
150g Dahi
```

Dinner card follows.

Optional:
- ingredients;
- quantities;
- preparation notes;
- "Prepared" toggle if enabled.

No charts.

No AI complexity unless explicitly added later.

---

## 10. Routine/Plan Detail Screen

Optional V1 screen.

Shows:
- plan name;
- active dates;
- recurring items;
- alternatives;
- reminders;
- nutrition targets.

Editing should preferably be done through chat.

---

## 11. Settings

Sections:
- notifications;
- reminder defaults;
- timezone;
- active plan;
- app installation/help;
- AI usage;
- session/logout.

---

## 12. PWA Requirements

Provide:
- app manifest;
- icons;
- standalone display;
- theme color;
- service worker;
- offline shell where practical;
- install guidance.

The application should feel app-like when launched from Android home screen.

---

## 13. Responsive Requirements

Primary breakpoint target:
- Android mobile.

Secondary:
- desktop browser.

Mom view should work comfortably on a phone.

User analytics can take advantage of larger desktop screens.

---

## 14. Accessibility

- keyboard support;
- semantic buttons;
- readable contrast;
- large touch targets;
- screen-reader labels;
- avoid relying solely on color for state;
- reduced motion support.

---

## 15. Stitch Implementation Boundary

Stitch output should consume typed application data such as:

```ts
type TodayOccurrence = {
  id: string;
  title: string;
  category: string;
  scheduledAt: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED" | "MISSED" | "REPLACED";
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};
```

Stitch-generated components should remain replaceable and should not contain database queries.
