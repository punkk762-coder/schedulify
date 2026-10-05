# Schedulfy UI Screen Catalog & Stitch Prompt Guide

This document defines the complete screen specifications for **Schedulfy (Personal Routine OS)** and provides ready-to-use **Stitch prompts**.

---

## 🎨 Workflow Strategy

### Step 1: Benchmark & Finalize Theme
Generate **Screen 1 (Today Cockpit)** in Stitch across the 4 curated themes below. Choose the one that gives the strongest "WOW" factor.

### Step 2: Scale Selected Theme
Once your theme is finalized, copy the **Production Prompts** in Section 3, prefixing each with your chosen theme's styling block.

---

## 🌈 Step 1: Theme Benchmark Matrix

Generate the benchmark screen in Stitch using the same layout with these 4 theme definitions:

### Theme A: Mediterranean Hearth & Terracotta (Current Schedulfy)
```text
Design Style: Warm Mediterranean editorial routine dashboard, tactile luxury craftsmanship.
Color Palette:
- Background: Warm Canvas #fff8f2, Light Peach #fcf2e6
- Primary Accent: Terracotta Clay #a43716, Deep Burnt Rust #7f260b
- Health & Success Accent: Mediterranean Olive #52652a, Sage Green #d4eca2
- Neutral Text: Deep Charcoal Espresso #1f1b14, Muted Clay #58423c, Soft Border #dfc0b7
- Hydration Accent: Mediterranean Azure #0284c7
Typography: Editorial Serif headers (Playfair Display / Serif), high-precision Monospace metrics (JetBrains Mono), clean Sans body (Inter).
Atmosphere: Organic, grounded, warm paper textures, rounded 2xl/3xl cards, subtle terracotta borders, crisp dot indicators.
```

### Theme B: Cyber-Executive Obsidian Dark
```text
Design Style: Ultra-sleek dark mode executive cockpit, high-density telemetry OS.
Color Palette:
- Background: Pitch Obsidian #0a0b0e, Charcoal Slate Panels #141720, Card Surface #1b202c
- Primary Accent: Vivid Electric Orange #f97316, Flame Crimson #ef4444
- Health & Success Accent: Neon Emerald #10b981, Lime Glow #a3e635
- Neutral Text: Crisp Snow #f8fafc, Titanium Muted #94a3b8, Subtle Grid Lines #283042
- Hydration Accent: Electric Cyan #06b6d4
Typography: Clean Grotesque Sans (Inter / SF Pro Display) with Monospace dials (Geist Mono / JetBrains Mono).
Atmosphere: Deep dark glassmorphism, subtle glowing neon telemetry rings, tactical borders with 1px border highlights, 16px/24px rounded corners.
```

### Theme C: Nordic Clean / Apple Health Minimalist
```text
Design Style: Pure Scandinavian minimalist wellness interface, frictionless and serene.
Color Palette:
- Background: Pure Crisp Chalk #f8f9fa, Card Surface #ffffff
- Primary Accent: International Klein Blue #0066cc or Deep Coral #ff453a
- Health & Success Accent: Vibrant Mint #34c759, Soft Mint Fill #e8f8ed
- Neutral Text: Jet Black #1d1d1f, Secondary Grey #86868b, Hairline Divider #e5e5ea
- Hydration Accent: Sky Cobalt #0a84ff
Typography: Apple-style SF Pro / Inter typography, bold large title headers, ultra-clean sans metrics.
Atmosphere: Generous whitespace, razor-thin borders, soft diffuse shadows, floating pill segmented controls.
```

### Theme D: Warm Espresso & Brushed Brass
```text
Design Style: Private-club executive health ledger, timeless bespoke stationery feel.
Color Palette:
- Background: Rich Cream Parchment #f5f2eb, Deep Espresso Surface #1c1816
- Primary Accent: Brushed Antique Brass #c59b27, Warm Cognac #9c4e24
- Health & Success Accent: Vintage Forest Green #2d5a3f, Muted Celadon #cde3d1
- Neutral Text: Dark Ink #181513, Sepia Secondary #6b635c, Warm Linen Line #dcd6cc
- Hydration Accent: Mineral Aqua #3b7c87
Typography: Classical Old Style Serif (Cormorant Garamond / Freight Text) paired with bespoke geometric sans.
Atmosphere: Premium leather-and-parchment stationery, debossed accents, foil stamp badges, understated luxury.
```

---

## 🚀 Benchmark Stitch Prompt (Today Cockpit)

Paste this prompt into Stitch with your chosen theme header above:

```text
Create a high-fidelity responsive UI for "Schedulfy — Personal Routine OS: Today Cockpit".

Desktop View (1440x900) & Mobile View (390x844):
1. Top Navigation:
   - App logo "Schedulfy (Cockpit)" with pulse dot
   - Navigation links: Today (active), Analytics, AI Coach, Mom's Deck, History, Settings
   - Right badges: "PostgreSQL Live", "Timezone: Active"

2. Executive Day Header:
   - Big date "Monday, October 5, 2026"
   - Subtitle: "Prescribed Mediterranean Protocol • High-Density Executive Cockpit"
   - Goal pill: "🎯 October Milestone: 72kg Target (In Progress)"
   - Adherence Dial: 71% completion rate circular progress indicator (5 of 7 completed)
   - Quick command input bar: 'Quick log (e.g. ate 2 eggs, walked 45m)...' with 'Log' button

3. Two-Column Desktop Layout (7 cols Left, 5 cols Right):
   - Left Column (Daily Timeline):
     - Filter pills: All (7), Meals (4), Workouts (2) + Order toggle: Focus Order / Timeline
     - "Next Up Now" Highlight Card:
       - Tag "NEXT UP • 19:00" in top-right
       - Icon, time 19:00, tag "MEAL", tag "Mom Prepping 🟢"
       - Title: "Dinner: Paneer Bhurji with 2 Phulkas - 450 kcal"
       - Macros: 450 kcal • 22g Protein
       - Action buttons: Green "Mark Done ✓" (with spinner loading state), "Swap Meal ⇄", "Skip"
     - Upcoming Queue & Recorded Today timeline cards with strike-through completed titles and "✓ Done ↩" undo buttons.
   - Right Column (Telemetry & Hearth Hub):
     - Metabolic Target card: Daily Nutrition Ledger (1,430 / 1,800 kcal progress bar, Protein 78/150g progress bar, Carbs, Fat)
     - Winter Arc HUD: "Phase 1: October Foundation & Consistency", "27 Days Remaining", "Phase 2 on Nov 1"
     - Movement Drag Slider: Interactive range slider for steps (0 to 20k) showing 11,500 steps, 8.76 km, 460 kcal, plus time slots (Morning, Aft, Eve, Night)
     - Hydration Drag Slider: Water intake (0 to 5L) showing 3,150 / 3,000 ml, time slots (Wakeup, Mid-day, Evening, Night)
     - Micronutrients checklist: Creatine (5g), Pink Salt/Lime, Magnesium (400mg) with timing toggles
     - Sleep Duration slider (8 hrs) & Muscle Soreness selector (Fresh, Mild, High)
     - Button: "Submit Day End Telemetry & Lock in DB" with sync status indicator
     - Mom's Kitchen Sync card: Preview of queued meals with link to Mom's Deck
     - AI Assistant Studio preview card

Make it look state-of-the-art, with clean padding, rich typography, micro-shadows, and zero overflowing elements.
```

---

## 📱 Complete Production Screens Catalog

### Screen 1: Today Routine Cockpit — Desktop Executive View
- **URL / Route**: `/today` (Desktop `lg+`)
- **Key Purpose**: High-density daily command center with 12-column split (7 cols routine ledger, 5 cols telemetry).
- **Core Elements**:
  - Live clock & date header with adherence circular dial.
  - Quick text bar for instant natural language logging.
  - Interactive routine timeline with smart Next Up focus card and undo capabilities.
  - Metabolic ledger (Calories, Protein, Carbs, Fat).
  - Fitness recovery cockpit (Winter arc countdown, steps slider, water slider, supplements checklist, sleep slider, DOMS buttons).
  - Mom's kitchen prep status link.
- **Stitch Prompt**:
```text
Design a clean, modern Desktop Executive Day Cockpit (1440x960) for personal fitness OS "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Panoramic 12-column grid inside 1280px container.
- Left 7 columns: Focus-mode daily routine stream with category segmented tabs (All, Meals, Workouts). Top card is an active Next Up routine item with prominent terracotta border, macros badges (kcal, protein), and action buttons: "Mark Done ✓", "Swap Meal ⇄", "Skip". Below it are completed cards with struck-through text and subtle "Done ↩" undo buttons.
- Right 5 columns: Telemetry cockpit. Macro tracker bars (Calories 1430/1800, Protein 78/150g). Winter Arc progress widget (27 days left in Phase 1). Two tactile range sliders: Steps (11.5k with km and calories burn) and Water (3.1L/3L target). Supplement pills with time of day pills (Creatine, Electrolytes, Magnesium). Sleep and muscle soreness controls with "Submit Day End Telemetry" button.
- Clean typography, perfect vertical balance between left and right columns.
```

---

### Screen 2: Today Routine Cockpit — Mobile Magnificent View
- **URL / Route**: `/today` (Mobile `< lg`, 390x844)
- **Key Purpose**: Tactile, thumb-friendly mobile experience with instant access to current action.
- **Core Elements**:
  - Glowing gradient hero pill with circular adherence meter & micro-macro badges.
  - Horizontal quick bubbles carousel: 🚶 +2k steps walk, 💧 +250ml, 💧 +500ml, 🍲 Mom's Kitchen, ⚡ AI Coach.
  - Giant "NEXT UP NOW" card right below quick bubbles with one-tap "✓ Mark Completed" and "⇄ Swap".
  - Segmented slider pills (All, Meals, Workouts).
  - Compact vertical timeline cards with status indicators.
  - Collapsible / scrollable Fitness Recovery Cockpit below timeline.
  - Fixed floating bottom quick input bar with generous clearance above navigation bar.
- **Stitch Prompt**:
```text
Design a magnificent, tactile mobile screen (390x844) for routine app "Schedulfy".
Theme: [Insert Your Finalized Theme]
Elements from top to bottom:
1. Top bar: Schedulfy logo with live sync indicator.
2. Hero Banner Pill: Rich gradient card with rounded 3xl corners. Shows Date, "5 of 7 completed", circular glowing 71% adherence dial, and 4 mini chips for Calories (1430), Protein (78g), Water (3.1L), Steps (13.5k).
3. Horizontal Scrolling Action Chips: "+2k Steps Walk", "💧 +250ml", "💧 +500ml", "🍲 Mom's Kitchen (1 Queued)", "⚡ AI Coach".
4. NEXT UP NOW Card: Highlighted card with large title "Dinner: Paneer Bhurji with 2 Phulkas", time "19:00", calories pill, and two giant thumb-friendly buttons: "✓ Mark Completed" (full width green button) and "⇄ Swap" (terracotta outlined button).
5. Category filter pills: All, Meals, Workouts.
6. Vertical routine cards stack for Later Today and Recorded items with undo buttons.
7. Telemetry & Winter Arc section with sliders for steps and water.
8. Bottom chat input bar "Tell Schedulfy (e.g. 'had green tea')..." resting above a clean 5-icon bottom navigation bar (Today, History, Coach, Macros, Settings).
```

---

### Screen 3: AI Coach Routine Studio — Chat & Voice Concierge
- **URL / Route**: `/chat`
- **Key Purpose**: Conversational routine interface powered by Gemini. Allows natural language logging, schedule inquiries, macro calculations, and meal swaps.
- **Core Elements**:
  - Desktop: Left 8-col chat conversation transcript, Right 4-col suggested directives & real-time DB binding card.
  - Mobile: Clean full-height chat transcript with horizontal suggested directive chips.
  - Chat bubbles: User speech vs AI Coach markdown replies with structured action cards (e.g., "Logged +2,000 steps (~1.52 km, 80 kcal)").
  - Send button with animated spinning loader during reasoning.
  - Top banner with shortcut to "Launch AI Plan Intake Wizard ➔".
- **Stitch Prompt**:
```text
Design an AI Coach Studio interface for "Schedulfy" (Desktop 1440x900 and Mobile 390x844).
Theme: [Insert Your Finalized Theme]
Components:
- Top banner: Golden/sage notification "Protocol cleared. Ready to set Calorie Limit and calibrate external plan" with button "Launch Wizard ➔".
- Main chat container: Clean chat conversation. User messages in warm rounded pill bubbles on the right. AI Coach responses on the left with avatar, rich markdown text, and inline structured badges (e.g. "+2,000 steps logged to database ledger ✓").
- Suggested prompt pills: "I walked 2k steps right now", "Set 72kgs for this october month", "Add 30 min morning run at 6:30 AM", "Show my macro balance".
- Input bar: Modern rounded container with input field and high-contrast "Send" button with inline loading spinner state ("Thinking...").
- Desktop sidebar: List of quick prompt shortcuts and explanatory card on direct PostgreSQL sync.
```

---

### Screen 4: AI Plan Intake & Calibration Wizard (3-Step Modal)
- **URL / Route**: `/chat?intake=1` or modal overlay
- **Key Purpose**: Calibrates target calories, parses external unformatted routines (from ChatGPT, dieticians, or PDFs), automatically calculates nutrition, identifies excess/deficiencies, and prompts the user with questions & custom write-in options.
- **Step 1: Calibration**: Slider/inputs for Calorie Limit (e.g. 1,800 kcal) and Protein Target (e.g. 150g).
- **Step 2: Paste Raw Routine**: Large textarea with "Load Sample Routine" button and "Analyze Protocol ⚡" button with loader.
- **Step 3: Decision Matrix**:
  - Top summary: Total calculated calories vs Calorie limit.
  - "What AI Kept" list with checkmarks and macros.
  - "What AI Needs Clarification On": List of questions with multiple-choice pill buttons and "✍️ Write Custom Answer" input.
  - Bottom action: "Confirm & Launch Protocol 🚀" with loading state.
- **Stitch Prompt**:
```text
Design a 3-step AI Plan Calibration & Intake Wizard modal (680px width on desktop, full-screen on mobile).
Theme: [Insert Your Finalized Theme]
Step 3 View (Decision Matrix):
- Modal header: "AI Plan Intake & Calibration" with step indicator (Step 3 of 3: Calibrate & Review).
- Calorie comparison card: Large font showing "1,980 / 1,800 kcal target" with yellow warning chip "Exceeds daily target by +180 kcal".
- Section 1: "Items Kept in Protocol (5 Items)" showing clean rows: Breakfast Chocolate Proats (380 kcal, 32g protein), Lunch 2 Phulkas & Paneer (450 kcal), etc.
- Section 2: "AI Clarification & Decisions":
  - Card 1: "Evening Snack Exceeds Calorie Cap" with 3 selectable option pills: "Option A: Halve chana portion to 50g (-90 kcal)", "Option B: Move to post-workout", and "✍️ Write Custom".
  - Card 2: "Rest Day Workout Intensity" with option pills.
- Footer buttons: "← Edit Plan" and large green button "Confirm & Launch Protocol 🚀" (with loading spinner state "Writing Protocol to DB...").
```

---

### Screen 5: Mom's Kitchen Meal Preparation Deck — Desktop
- **URL / Route**: `/mom` (Desktop `lg+`)
- **Key Purpose**: Dedicated kitchen interface for household chef / mom. Zero fitness jargon, focuses strictly on meal preparation times, recipes, and exact portion weights.
- **Core Elements**:
  - Clean Chef's Countertop Header with date, print button, and prep progress ("3 of 4 Ready (75%)").
  - 2-Column grid of scheduled meals (Breakfast, Lunch, Evening Snack, Dinner).
  - Each meal card displays: Scheduled serving time, Meal type pill, "Mark Prepared" / "✓ Prepared" button with loader.
  - Expandable / highlighted recipe ingredients table: Ingredient name with exact portion badge (e.g. "50 g", "1 scoop", "150 ml").
  - Struck-through completed style when prepared.
- **Stitch Prompt**:
```text
Design "Mom's Meal Preparation Deck" Desktop view (1440x900) for "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Header: Chef's Countertop title, "Household Hearth Sync • Kitchen Prep Ledger", Today's date, prep progress bar "3 of 4 Ready (75%)", and buttons: "← View Today", "🖨️ Print", "Logout".
- Main Grid: 2-column card layout displaying today's scheduled meals:
  - Card 1 (Breakfast 10:15 AM): Title "Chocolate Proats", marked as "✓ Prepared" in olive green with strike-through title.
  - Card 2 (Lunch 12:30 PM): Title "2 Phulkas with Cabbage Sabzi & Paneer", marked as "✓ Prepared".
  - Card 3 (Evening Snack 05:30 PM): Title "Boiled Kala Chana Chaat", button "Mark Prepared" with loading spinner. Ingredients list box showing "Kala Chana (100 g)", "Pink Salt (1 pinch)", "Lemon (0.5 piece)".
  - Card 4 (Dinner 07:00 PM): Title "Paneer Bhurji with 2 Phulkas".
- High readability, large fonts, clear portion measurement tags, zero confusing fitness telemetry.
```

---

### Screen 6: Mom's Kitchen Meal Board — Mobile
- **URL / Route**: `/mom` (Mobile `< lg`, 390x844)
- **Key Purpose**: Mobile countertop screen placed beside the stove. Giant buttons, easily tapped with flour/wet hands.
- **Core Elements**:
  - Warm hearth gradient header with prepared counter meter (3 / 4 Ready).
  - Large vertical meal recipe cards.
  - Ingredients & portions breakdown with colored dots.
  - Giant full-width tactile toggle button: "Mark as Prepared" (cream) or "✓ Prepared (Tap to Undo)" (olive green).
- **Stitch Prompt**:
```text
Design "Mom's Kitchen Meal Board" for mobile (390x844) in "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Top banner: Warm olive/terracotta gradient hero with title "Mom's Meal Board", date, and horizontal progress bar showing "3 / 4 Ready (75%)".
- Meal cards list:
  - Card: 12:30 PM Lunch. Title "2 Phulkas with Paneer Bhurji".
  - Recipe ingredients box: "Phulkas: 2 pcs", "Paneer: 100 g", "Cucumber Salad: 1 bowl".
  - Huge thumb-friendly button across the bottom of the card: "✓ Prepared (Tap to Undo)".
  - Next Card: 05:30 PM Snack with "Mark as Prepared" button.
- Clean high-contrast typography, large touch targets, tactile kitchen-friendly buttons.
```

---

### Screen 7: Analytics & Winter Arc Retrospective
- **URL / Route**: `/analytics`
- **Key Purpose**: Multi-month adherence tracking, body weight milestone analytics, and Phase 1 (October) to Phase 2 (November) winter arc transition.
- **Core Elements**:
  - Top KPI cards: Current Weight vs Goal (e.g. 73.2kg vs 72.0kg target), Average Daily Steps (11,840), Macro Adherence (94%), Total Distance Walked (248 km).
  - October Winter Arc Phase 1 Retrospective card with milestone progress bar.
  - Weight Trajectory Line Chart (with target line at 72kg).
  - Daily Steps Bar Chart (showing days where 8,000 steps were surpassed).
  - Monthly Goal Achievement banner: "October Achieved! Set November Phase 2 Goals".
- **Stitch Prompt**:
```text
Design an Analytics & Winter Arc Retrospective dashboard (Desktop 1440x900 and Mobile 390x844) for "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Header: "Performance & Milestone Analytics", "October Retrospective & Winter Arc Phase 1 Ledger".
- KPI Grid: 4 cards:
  1. Weight: "73.2 kg" with "-2.8 kg this month" and target indicator "72.0 kg Goal".
  2. Steps: "11,840 avg/day" with flame icon.
  3. Routine Adherence: "91% Complete".
  4. Distance: "248.4 km total".
- Charts Section:
  - Left: Interactive weight trend curve showing steady decline towards October goal.
  - Right: Daily step consistency heat map or bar chart with 8,000 step milestone benchmark.
- Winter Arc Phase Transition Module: Banner celebrating October milestone achievement with button "Calibrate November Phase 2 Protocol →".
```

---

### Screen 8: Routine History & Day-by-Day Archive
- **URL / Route**: `/history`
- **Key Purpose**: Audit historical compliance across any day in the month. Review what meals were eaten, what alternatives were swapped, and past telemetry.
- **Core Elements**:
  - Horizontal calendar day carousel / date picker.
  - Selected day summary: Completion rate, total calories/protein logged, steps walked.
  - Full routine occurrence audit checklist (Completed, Skipped, Replaced with alternative item).
  - Recovery details for that day (Sleep hours, Soreness, Hydration).
- **Stitch Prompt**:
```text
Design a History & Archive screen (Desktop 1440x900 and Mobile 390x844) for "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Header: "Routine Archive & Past Ledgers".
- Date selector: Clean calendar strip showing days of October with completion rings under each date.
- Day Summary Banner for selected date (e.g., Oct 2, 2026): "6 of 7 Protocols Executed • 1,780 kcal • 142g Protein • 12,100 Steps".
- Audited Timeline: List of past cards with distinct status pills: "✓ Done", "↷ Skipped", and "⇄ Swapped for Greek Yogurt".
- Historical Telemetry summary box at bottom.
```

---

### Screen 9: Dual-Persona PIN Access Keypad
- **URL / Route**: `/login`
- **Key Purpose**: Fast, friction-free login gatekeeper supporting both USER (1234) and MOM (5678) personas.
- **Core Elements**:
  - Brand header with Schedulfy icon and "Mediterranean Routine Protocol" tagline.
  - 4 interactive PIN dot indicators that scale and glow as digits are entered.
  - Numeric 3x4 keypad (1-9, Clear, 0, Backspace).
  - Inline verifying spinner ("Verifying PIN...").
  - Footer hint: "USER (1234) • MOM (5678)".
- **Stitch Prompt**:
```text
Design a minimal, ultra-clean PIN Keypad Login screen (Desktop 1440x900 and Mobile 390x844) for "Schedulfy".
Theme: [Insert Your Finalized Theme]
Layout:
- Centered card on canvas background.
- Brand logo: Minimalist clock/routine glyph in warm rounded container. App title "Schedulfy", subtitle "Routine OS".
- Status text: "ENTER ACCESS PIN".
- 4 large circular PIN dots showing 2 filled dots and 2 empty dots.
- Numeric Keypad: 3x4 grid of tactile rounded square buttons (numbers 1 to 9, Clear, 0, Backspace) with smooth border hover and active press animations.
- Subtle footer text: "USER (1234) • MOM (5678)".
```

---

### Screen 10: Meal Substitution & Alternatives Modal
- **URL / Route**: Modal overlay in `/today`
- **Key Purpose**: Instant healthy meal swap when user cannot eat prescribed meal.
- **Core Elements**:
  - Current meal summary: "Dinner: Paneer Bhurji with 2 Phulkas (450 kcal, 22g protein)".
  - List of healthy pre-calibrated alternatives (e.g. "Tofu Scramble with Toast - 420 kcal, 24g protein", "Soya Chunk Bowl - 440 kcal, 30g protein").
  - Macro delta preview badges: `+2g Protein`, `-30 kcal`.
  - Button on each alternative: "Select Alternative ⇄" with disabled loader state ("Substituting...").
- **Stitch Prompt**:
```text
Design a Meal Substitution Modal (520px width modal dialog, centered with backdrop blur).
Theme: [Insert Your Finalized Theme]
Layout:
- Modal Header: "Swap Meal with Healthy Alternative ⇄" with close button.
- Current Meal Card: "Replacing: Dinner (Paneer Bhurji with 2 Phulkas • 450 kcal)".
- Alternatives List: 3 selectable cards:
  - Card 1: "Tofu Scramble with Multigrain Toast" (420 kcal, 24g Protein). Macro delta pill: "+2g Protein, -30 kcal". Button: "Substitute ⇄".
  - Card 2: "Soya Chunk Veggie Bowl" (440 kcal, 30g Protein). Macro delta pill: "+8g Protein, -10 kcal". Button: "Substitute ⇄".
  - Card 3: "Boiled Eggs (3 Whole + 2 Whites) with Salad" (390 kcal, 28g Protein).
- Clean borders, clear calorie comparisons, loading state with spinner on the clicked button.
```

---

### Screen 11: Protocol Execution Confirmation & Loading Modal
- **URL / Route**: Modal overlay when marking an item done
- **Key Purpose**: Prevents accidental clicks, gives user confirmation of macros being committed to DB, and displays loading spinner followed by green animated checkmark.
- **Core Elements**:
  - Step A (Confirm): Protocol preview card, macro bonus badge (`+22g Protein`), Cancel button, and "Confirm Done ✓" button.
  - Step B (Loading): "Confirm Done" turns into disabled button with spinning loader `Logging to DB...`.
  - Step C (Success): Modal body transforms into animated green checkmark with "Protocol Done! ✓ Logged to database ledger".
- **Stitch Prompt**:
```text
Design a Protocol Execution Confirmation & Success Modal (460px width dialog).
Theme: [Insert Your Finalized Theme]
Show two states side-by-side or stacked:
1. State 1 (Confirmation):
   - Header: "Confirmation Required" with pulsing dot.
   - Title: "Mark Protocol as Done?"
   - Preview Box: Scheduled time 19:00, Meal category, Title "Dinner: Paneer Bhurji", Macro badges "450 kcal", "+22g Protein".
   - Buttons: "Cancel" (outlined) and "Confirm Done ✓" (solid olive button with loading spinner state).
2. State 2 (Success Animation):
   - Large green circular checkmark icon with subtle glow.
   - Headline: "Protocol Done! ✓".
   - Subtext: "Logged to today's database ledger".
```

---

## 🛠️ Summary Matrix of All Screens

| # | Screen Name | Route | Desktop | Mobile | Primary Purpose |
|---|---|---|---|---|---|
| 1 | Today Routine Cockpit | `/today` | Yes (12-col) | Yes (Stack) | Daily routines, macros, sliders, telemetries |
| 2 | AI Routine Studio | `/chat` | Yes (2-pane) | Yes (Chat) | Conversational voice logging & queries |
| 3 | AI Plan Intake Wizard | `/chat?intake=1` | Modal | Full-screen | 3-step external plan importer & calorie calibrator |
| 4 | Mom's Kitchen Deck | `/mom` | Yes (Grid) | Yes (Hearth) | Kitchen recipes, portions & prep toggles |
| 5 | Analytics & Winter Arc | `/analytics` | Yes | Yes | Milestone retrospective, weight & step charts |
| 6 | Routine History Archive | `/history` | Yes | Yes | Past day compliance & audit log |
| 7 | PIN Keypad Access | `/login` | Centered | Centered | USER (1234) & MOM (5678) dual login |
| 8 | Meal Swap Modal | Overlay | Modal | Sheet | Substitute meals with healthy alternatives |
| 9 | Confirmation & Success Modal | Overlay | Modal | Sheet | Verification, loader & checkmark animation |
