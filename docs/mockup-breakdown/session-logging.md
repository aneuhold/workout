# Session Logging (`/session/[id]`)

The session logging page displays all exercises for a workout session in one continuous scrollable view. There is no pagination. The user works through sets one at a time; the current set and exercise are visually emphasized.

## 1. Session Header

The session title and a description line (e.g. week number and phase name) at the top.

## 2. Progress Bar

A **Progress** bar showing the percentage of completed sets, with a "X/Y sets" text counter beside it.

## 3. Exercise Cards

A vertical list of **Card** elements, one per exercise in the session. Each card is collapsible.

### Card-Level Visual States

- **Current exercise** (contains the next incomplete set): The card has a subtle heartbeat animation (gentle scale pulse on a 2-second loop) and a ring highlight.
- **Completed exercise** (all sets done): The card is reduced in opacity.
- **Future exercise** (no sets started, not current): Default card appearance.

### Exercise Card Header

Always visible. Tapping the header toggles the card body.

Contents:
- **Status indicator** (left of the title):
  - If all sets complete: A small circle with a check icon.
  - If this is the current exercise: A small circle with a pulsing dot.
  - Otherwise: nothing.
- Exercise name as **CardTitle**.
- Expand/collapse chevron icon on the right.
- Below the title, a wrapped row of **Badge** elements:
  - Rep range badge (**Badge**, outline) — the rep range category (Heavy, Medium, Light).
  - Equipment badge (**Badge**, outline).
  - One badge per muscle group (**Badge**, secondary).

### Exercise Card Body

Shown when the card is expanded. Contains four sections separated by **Separator** elements.

---

#### a. Set Table

A grid-based table for tracking each set.

**Header row** (muted text): Set number, Weight, Reps, RIR, and an unlabeled action column.

**Set rows** — One row per planned set, displayed in a 12-column grid:

| Column | Span | Content |
|---|---|---|
| Set # | 1 | The set number. Color-coded: completed = success, current = primary, future = muted. |
| Weight | 3 | **Input** (number). Pre-filled with actual weight if logged, otherwise placeholder shows planned weight. Disabled when set is completed. |
| Reps | 3 | **Input** (number). Same pattern as weight. |
| RIR | 2 | **Input** (number). Same pattern as weight. |
| Action | 3 | Depends on set state (see below). |

**Set row states:**

- **Completed set**: The action column shows a "Done" **Badge** (outline, success-styled) with a check icon. Inputs are disabled. The row has a muted background.
- **Current set** (the next incomplete set in the current exercise): The row has a highlighted background with a ring. The action column shows:
  - A "Log" **Button** (extra-small) that marks the set as complete.
  - A timer **Button** (outline, icon-only, extra-small) with a clock icon, for quickly starting a rest timer.
- **Future set** (not yet reachable): The action column shows the planned targets as muted text: "Xlb xY @Z RIR". Inputs are not disabled but have placeholder values.

---

#### b. Stimulus (RSM) Sliders

A section with a heading "Stimulus (RSM)" accompanied by an info **Popover**.

**RSM Info Popover**: Uses **Popover** + **PopoverTrigger** (info icon) + **PopoverContent** explaining what RSM is.

Three sliders, each following the same pattern:

- **Label** on the left, current value description on the right (color-coded for positive scoring: higher = better).
- A **Slider** with range 0–4, step 1.
  - Position 0 = "Not Set" (the value is treated as undefined).
  - Positions 1–4 map to scores 0–3.

The three RSM sliders:
1. **Mind-Muscle Connection** — 0: Barely aware → 3: Near limit.
2. **Pump** — 0: No pump → 3: Near maximal.
3. **Disruption** — 0: No fatigue → 3: DOMS for days.

---

#### c. Fatigue Sliders

Same pattern as RSM but with a "Fatigue" heading and info **Popover** explaining SFR.

Three sliders with **negative** color coding (higher = worse):
1. **Joint & Tissue Disruption** — 0: Minimal pain → 3: Chronic pain.
2. **Perceived Effort** — 0: Very easy → 3: Drained for days.
3. **Unused Muscle Performance** — 0: Better than expected → 3: Hugely deteriorated.

---

#### d. Recovery Indicators

A "Recovery Indicators" heading (no popover), with two sliders:

1. **Soreness** — Negative color coding. 0: Not sore → 3: DOMS remained.
2. **Performance** — Special color coding where score 2 ("Hit target") is best and score 3 ("Couldn't match") is worst. 0: Off by 2+ RIR → 2: Hit target → 3: Couldn't match.

---

### Slider Pattern Summary

All sliders across RSM, Fatigue, and Recovery share the same structure:
- **Label** (left) + value description text (right, color-coded).
- **Slider** component, single-value, range 0–4, step 1.
- Value 0 = "Not Set", values 1–4 map to scores 0–3.
- Color coding direction varies by metric: positive (RSM), negative (Fatigue, Soreness), or custom (Performance).

## 4. Session Summary Card

A **Card** at the bottom of the page containing:

- **CardHeader**: "Session Summary" title.
- **CardContent**:
  - A 2-column centered grid showing:
    - "Sets Completed" — count (e.g. "5/14").
    - "Progress" — percentage.
  - A full-width "Complete Session" **Button** (large). Disabled until all sets are completed.
