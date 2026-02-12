# Mesocycle List (`/plan`)

The plan list page shows the current active mesocycle with a visual calendar preview, and a list of past mesocycles below. This is the read-only view — creation and editing happens at `/plan/new`.

## 1. Header Row

The page title "Mesocycles" on the left, and a "New" **Button** (small, with plus icon) linking to `/plan/new` on the right.

## 2. Current Mesocycle Card

**Card** containing:

### Card Header

- Mesocycle title as **CardTitle** on the left, cycle type **Badge** (secondary) on the right.
- Description line: "Cycle X of Y".

### Card Content

#### a. Week Progress Bar

A thin **Progress** bar representing current week / total weeks.

#### b. Mesocycle Calendar Grid

The shared calendar component (see [shared-calendar.md](./shared-calendar.md)).

In this context, the calendar has read-only semantics with temporal awareness: past cycles show completed styling (muted, with check icons), the current cycle is highlighted, and future cycles have a lighter treatment. Deload days have a dashed outline. Tapping a session day opens the Day Detail Dialog.

#### c. Week Progression Badges

A horizontally wrapped row of badge groups, one per microcycle plus one for deload. Each badge group contains:

- Cycle label: "C1", "C2", etc., or "DL" for deload.
- An RIR **Badge** (secondary) showing the RIR value for that cycle.
- A set modifier **Badge** (outline) showing "Base", "+1", "+2", or a negative value.

The badge group for the current cycle is visually highlighted (primary border and background).

## 3. Past Mesocycles List

Shown only if there are past mesocycles. A "Past Mesocycles" section heading, followed by a vertical list of small **Card** elements. Each card is wrapped in a link.

### Past Mesocycle Card

**Card** (small) containing **CardContent** with a horizontal row:
- A square icon container with a calendar icon.
- A text block:
  - Mesocycle title (truncated) with a cycle type **Badge** (outline) beside it.
  - Below: date range and "X/Y sessions" completion count.
- A right-chevron icon on the far right.

## Day Detail Dialog

When a session day is tapped in the calendar, a **Dialog** opens. See the Day Detail Dialog section in [shared-calendar.md](./shared-calendar.md) for the full description.
