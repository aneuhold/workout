# Shared: Mesocycle Calendar Grid + Day Detail Dialog

The mesocycle calendar grid is the core visual component for the planning pages. It renders the entire mesocycle schedule in a compact, scannable layout. It appears on both `/plan` (read-only, with temporal state) and `/plan/new` (preview, all-future). The Day Detail Dialog is triggered by tapping a session day in either context.

## Mesocycle Calendar Grid

### Layout Structure

The calendar is a fixed 7-column grid, one column per day of the traditional week (Sun through Sat). At the top, a row of 7 muted day-of-week headers (Sun, Mon, Tue, Wed, Thu, Fri, Sat).

Below the headers, the mesocycle's days are laid out sequentially starting from the mesocycle start date. Each calendar row represents one traditional week. The final row may be incomplete and is padded with empty cells on the right.

The total number of days rendered is `microcycle_length_days * (microcycle_count + 1)`, where the extra "+1" accounts for the deload week appended at the end.

### Microcycles vs. Calendar Rows

This is the key distinction: **microcycles (training cycles) do not necessarily align with calendar weeks**. The microcycle length is configurable (e.g. 8 days), so a microcycle boundary often falls mid-row. The calendar tracks which microcycle each day belongs to based on its sequential position (`weekNum = floor(day_index / microcycle_length) + 1`), not based on which row it's in.

### Cycle Label Rows

When any day in a calendar row is either the **start of a new microcycle** or the **start of a new calendar month**, a label row is rendered immediately above that week's day cells. The label row is also a 7-column grid, but contains text labels instead of day cells:

- **Cycle start label**: Shown on the day that starts the microcycle. Displays "Cycle 1", "Cycle 2", etc., or "Deload" for the final cycle.
- **Month label**: Shown on the first day of a new month (or the very first day of the mesocycle). Displays the month abbreviation and year (e.g. "Feb 2026").

If a day is both a cycle start and a month start, both labels appear together on the same day's position in the label row. Other positions in the label row are empty.

### Cycle Start Border

The first day of each microcycle has a left border on its cell, creating a vertical marker that visually indicates where the cycle begins within the row. This is critical because cycle boundaries don't align with row boundaries.

### Day Cell Types

Every day cell shows the calendar date number at the top.

| Type | Condition | Content Below Date |
|---|---|---|
| Rest day | Day-of-week matches a configured rest day | "Rest" text |
| Session day | Not a rest day and has assigned sessions | Session title (truncated). If multiple sessions on one day, shows the first title plus small dots below indicating the count. |
| Empty day | Not rest, no sessions assigned | Nothing (just the date) |

### Session Assignment Logic

Sessions are assigned sequentially to non-rest days. The session list cycles: if there are 4 session definitions, day 1 gets session 1, day 2 gets session 2, etc., wrapping back to session 1 after session 4. Rest days are skipped entirely in this sequence.

### Day Cell Visual States

The calendar supports different visual treatments depending on context:

#### In the plan list page (`/plan`) — temporal awareness:

| State | When | Visual Treatment |
|---|---|---|
| Past cycle | `weekNum < currentWeek` | Muted background, muted text. A small check icon in the top-right corner of session days. |
| Current cycle | `weekNum == currentWeek` | Highlighted ring and background. Session title in primary color. |
| Future cycle | `weekNum > currentWeek` and not deload | Lighter highlight, ring. Session title in primary color. |
| Deload | Final cycle | Dashed ring. Session title in reduced-opacity text. Dots (if multi-session) also reduced opacity. |

#### In the plan new page (`/plan/new`) — no temporal state:

| State | When | Visual Treatment |
|---|---|---|
| Session day | Not rest, has sessions, not deload | Highlighted ring and background. Session title in primary color. |
| Deload day | Final cycle, has sessions | Dashed ring. Session title in reduced-opacity text. |
| Rest day | Rest | Muted. |
| Empty day | No sessions | Muted. |

### Interaction

Session day cells (those with at least one session) are tappable buttons. Tapping opens the Day Detail Dialog. Rest days and empty days are not interactive.

---

## Day Detail Dialog

Opened when the user taps a session day cell in the calendar.

### Structure

A **Dialog** with **DialogContent** containing:

#### Header

- **DialogTitle**: The date (month abbreviation + day number) followed by a dash and the cycle label (e.g. "Feb 5 — Cycle 3" or "Mar 15 — Deload").
- **DialogDescription**: "Projected targets".

#### Body

For each session assigned to that day (usually one, occasionally two):

- A heading row: session title + an RIR **Badge** (secondary) showing the RIR value for this cycle.
- Below, a list of exercises in the session. For each exercise:
  - Exercise name (small, bold).
  - A 3-column grid of set targets:
    - Set number label (S1, S2, ...).
    - Rep count.
    - Weight in lb (right-aligned).

If there are multiple sessions on the day, they are separated by a **Separator**.

### Target Computation

The targets shown in the dialog are computed from:
1. The cycle number of the selected day, which determines RIR and set modifier via the week progression formula.
2. Each exercise's calibrated 1RM and base sets from calibration data.
3. The rep count from the exercise's rep range category (Heavy = 6, Medium = 10, Light = 15).
4. Weight = `1RM / (1 + (reps + RIR) / 30)`, rounded to nearest 5.
5. Set 1 uses base reps; subsequent (backoff) sets use base reps + 2.
6. Set count = base sets + set modifier (minimum 1).
