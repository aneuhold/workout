# Home Dashboard (`/`)

The home page is a single-column, max-width container with vertical spacing between sections. It serves as the entry point, surfacing the most actionable items: the next session to log, any incomplete past sessions, and quick access to recent history.

## 1. Mesocycle Overview Header

A row with the mesocycle title and current week counter on the left, and a cycle type **Badge** (secondary) on the right. Below the row, a thin **Progress** bar shows week progression (current week / total weeks).

## 2. Next Session Card

**Card** containing:

- **CardHeader**: "Next Up" title, session name as description.
- **CardContent**:
  - Short text summary (exercise count, estimated duration).
  - A wrapped row of **Badge** (outline) elements, one per exercise name in the session.
  - A full-width "Start Session" **Button** (large) that links to the session logging route. The button has an inline play icon.

## 3. This Week's Sessions Card

**Card** containing:

- **CardHeader**: title "This Week's Sessions", description showing current week label.
- **CardContent**: A vertical list of expandable session rows.

### Session Row (one per session in the microcycle)

Each row is a bordered container acting as an accordion item.

**Collapsed state** (always visible, tappable to toggle):
- Session title (truncated).
- A "Next" **Badge** (default variant) on the session that comes next, if applicable.
- Summary stats in muted text: exercise count, total set count, RIR value.
- Expand/collapse chevron icon.

**Expanded state** (shown below the collapsed header, separated by a border):
- A list of exercises in the session. Each exercise shows:
  - Exercise name (bold).
  - Set targets as a dot-separated string of "weight x reps" values.

The set targets are computed from the mesocycle's week progression logic: RIR decreases and set count increases as weeks advance. Set 1 uses the base rep count; subsequent sets add +2 reps as backoff sets. Weight is derived from the exercise's calibrated 1RM using a percentage formula based on effective reps (reps + RIR).

## 4. Pending Logs Card

Only rendered if there are sessions with missing data.

**Card** containing:

- **CardHeader**: title "Pending Logs" with an alert icon, styled as destructive/warning.
- **CardContent**: A list of tappable rows, each linking to the session logging route.
  - Each row shows: session title, date, what data is missing (e.g. "RSM scores, Soreness").
  - A right-chevron icon indicates the row is tappable.

## 5. Recent Sessions List

A section heading "Recent Sessions" followed by a vertical list of small **Card** elements. Each card is wrapped in a link to that session's logging page.

### Recent Session Card

**Card** (small size) containing **CardContent** with a horizontal row:
- A square icon container with a barbell icon.
- A text block: session title (truncated) with date on the right, and below that, "X/Y sets" and "RSM: Z/9" stats.
- A right-chevron icon.

## 6. Quick Links

A **Separator**, then a 2-column grid of outline **Button** elements:
- "Plan Mesocycle" — links to `/plan`, with a calendar icon.
- "View Analytics" — links to `/analytics`, with a trending-up icon.

Each button stacks the icon above the label text.
