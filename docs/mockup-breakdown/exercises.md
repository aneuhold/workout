# Exercise Library (`/exercises`)

The exercise library is a searchable, filterable list of exercises with expandable detail panels. Its primary purpose is to let the user see their full exercise inventory and the calibration status of each exercise.

## 1. Header Row

The page title "Exercise Library" on the left, and an "Add Exercise" **Button** (small) with a plus icon on the right.

## 2. Search Input

An **Input** with a search icon positioned inside the left edge. Searches across exercise name, muscle groups, and equipment. Results filter in real-time as the user types.

## 3. Filter Tabs

A **Tabs** component with a full-width **TabsList** containing three **TabsTrigger** elements:
- **All** — Shows all exercises (with count).
- **Calibrated** — Shows only exercises that have calibration data (with count).
- **Needs Cal.** — Shows only uncalibrated exercises (with count).

Switching tabs filters the list below. The search query and tab filter are combined (both must match).

## 4. Exercise List

A vertical list of small **Card** elements, one per exercise (after filtering). Each card is expandable.

### Exercise Card Header

Always visible. The entire header is a tappable button that toggles the detail panel.

Contents arranged in a row:
- Left column (flexible):
  - Exercise name as **CardTitle**, with a warning triangle icon beside it if the exercise is uncalibrated.
  - A wrapped row of **Badge** elements:
    - Rep range **Badge** (outline, color-coded by range category).
    - One **Badge** (secondary) per primary muscle group.
- Right: expand/collapse chevron icon.

### Exercise Card Detail

Shown when expanded. Begins with a **Separator**.

#### a. Properties Grid

A 2-column grid of label/value pairs:
- Equipment
- Progression type (Rep or Load)
- Rest time (in seconds)
- Rep Range category

#### b. Muscle Groups

A "Muscle Groups" label, then a wrapped row of badges:
- Primary muscles as **Badge** (default variant).
- Secondary muscles as **Badge** (outline variant).

#### c. Notes

If the exercise has notes, a "Notes" label followed by the text.

#### d. Calibration Section

Preceded by a **Separator**.

**If calibrated:**
- A muted container showing:
  - A "Calibrated" status line with a check icon and the calibration date.
  - A 3-column centered grid: Weight (lb), Reps, and Estimated 1RM (lb).

**If not calibrated:**
- A warning-styled container with a warning icon, "Not Calibrated" heading, and a message about needing calibration for accurate load recommendations.
- Below it, a full-width "Add Calibration" **Button** (outline, small) with a barbell icon.

## 5. Empty State

When the filtered list is empty, a centered empty state is shown: a large search icon and "No exercises found" text.
