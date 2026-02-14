# Mesocycle Planner (`/plan/new`)

The mesocycle planner is an interactive form for creating a new mesocycle. Configuration changes (cycle count, rest days, session definitions, exercises) reactively update the calendar preview and progression tables. The page is a single scrollable column of cards.

## 1. Page Title

"Mesocycle Planner" heading.

## 2. Configuration Card

**Card** with header "Configuration" and description "Set up your mesocycle parameters".

**CardContent** contains:

#### a. Title Input

**Label** + **Input** (text). The mesocycle name.

#### b. Cycle Type Select

A **Label** with an info **Popover** beside it:
- **PopoverTrigger**: info circle icon.
- **PopoverContent**: explains the three cycle types (Muscle Gain, Resensitization, Cut).

A **Select** dropdown with **SelectTrigger** showing the current selection and **SelectContent** with three **SelectItem** options:
- Muscle Gain
- Resensitization
- Cut

#### c. Numeric Config Row

A 3-column grid of labeled number inputs:

| Field | Label | Range |
|---|---|---|
| Weeks | "Weeks" | 2–8 |
| Sessions/Week | "Sessions/Week" | 2–6 |
| Days/Cycle | "Days/Cycle" | 5–10 |

Each is a **Label** (small) + **Input** (number).

#### d. Rest Days Selector

A **Label** "Rest Days", followed by a row of 7 toggle buttons (Sun through Sat). Each button represents a day of the week. Tapping toggles that day as a rest day (selected = active appearance, deselected = muted). Multiple days can be selected.

These are plain button elements, not a UI primitive.

## 3. Sessions Card

**Card** with header containing:
- "Sessions" title + description showing session count.
- An "Add" **Button** (small, plus icon) to add a new session.

**CardContent** contains a vertical list of accordion-style session definitions.

### Session Item

Each session is a bordered container with a collapsible header.

**Collapsed header** (tappable):
- A drag-handle icon (visual indicator only in the mockup).
- Session title text.
- An exercise count **Badge** (outline).
- Expand/collapse chevron icon.

**Expanded body** (below header, with border-top):

1. **Title Input** — An **Input** bound to the session title, allowing inline rename.

2. **Exercise List** — A numbered vertical list of the exercises in this session. Each row contains:
   - Position number.
   - Exercise name.
   - Rep range **Badge** (outline, color-coded).
   - A remove **Button** (ghost, icon-only) with an X icon.

3. **Add Exercise** — Two states:
   - **Default**: A full-width "Add Exercise" **Button** (outline, small, plus icon). Tapping switches to the adding state.
   - **Adding**: A **Select** dropdown listing all exercises not already in this session. Selecting an exercise adds it and exits the adding state. A "Cancel" **Button** (ghost, extra-small) exits without adding.

4. **Remove Session** — Shown only if there is more than one session. A "Remove Session" **Button** (destructive, extra-small) with an X icon, right-aligned.

## 4. Schedule Preview Card

**Card** with header "Schedule Preview" and a description summarizing the plan (e.g. "5 weeks, 4 sessions each + deload").

**CardContent** contains the shared Mesocycle Calendar Grid (see [shared-calendar.md](./shared-calendar.md)).

In this context all days are treated as future (no completed/current state distinction). Session days and deload days have the same styling as described in the shared calendar doc. Tapping a session day opens the Day Detail Dialog.

## 5. Microcycle Progression Card

**Card** with header "Microcycle Progression" and description "Per-exercise targets across cycles".

**CardContent** contains a **Tabs** component with one tab per session definition. The tab bar uses **TabsList** + **TabsTrigger** per session.

### Per-Session Tab Content (**TabsContent**)

A vertical list of exercises in that session. For each exercise:

#### Exercise Header

The exercise name followed by a rep range **Badge** (outline, color-coded).

#### Progression Table

A bordered, divided table showing how the exercise progresses across all cycles plus deload:

**Column headers** (muted, small text): cycle label, RIR, Sets, Targets (reps x weight).

**Rows** — One per cycle (C1, C2, ... Cn, DL):

| Column | Content |
|---|---|
| Cycle | "C1", "C2", ..., or "DL" for deload |
| RIR | The RIR value for that cycle |
| Sets | The set count, with an arrow indicator if it changed from the previous cycle (up = more sets, down = fewer) |
| Targets | Space-separated "reps x weight" for each set. Color-coded relative to the previous cycle: increases highlighted positively, decreases highlighted as warnings, brand-new sets (from set count increases) highlighted as additions. |

The deload row has a muted background.

The progression logic follows: RIR starts at (total weeks - 1) and decreases by 1 each cycle down to 0. Set count starts at the base, increases by +1 after cycle 2, and by +2 after cycle 4. Deload has RIR 5 and set count reduced by 1 from base. Weight is derived from calibrated 1RM using the formula: `1RM / (1 + (reps + RIR) / 30)`, rounded to the nearest 5. Set 1 uses base reps; subsequent sets use base reps + 2 as backoff.

## 6. Plan Summary Card

**Card** with header "Plan Summary".

**CardContent** contains:
- A 2x2 grid of stat pairs (label + value):
  - Total Duration (weeks including deload).
  - Total Sessions (sessions per cycle * cycle count).
  - Unique Exercises (distinct exercises across all sessions).
  - Cycle Type.
- A **Separator**.
- A full-width "Create Mesocycle" **Button** (large) with a check icon.

## Day Detail Dialog

When a session day is tapped in the calendar preview, a **Dialog** opens. See [shared-calendar.md](./shared-calendar.md) for the full description.
