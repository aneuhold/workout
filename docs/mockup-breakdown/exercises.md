# Library (`/library`)

A tabbed library for managing exercises, muscle groups, and equipment. Each tab displays a searchable list of cards with expandable detail panels. All items are fully editable.

## 1. Header Row

The page title "Library" on the left, and an "Add" **Button** (small) with a plus icon on the right. The add button's action corresponds to the active tab (adds an exercise, muscle group, or equipment respectively). On the "All" tab, tapping it opens a small menu to choose which type to add.

## 2. Search Input

An **Input** with a search icon inside the left edge. Filters the list in real-time within the currently selected tab. On the "All" tab, it searches across all entity types.

## 3. Tabs

A **Tabs** component with a full-width **TabsList** containing four **TabsTrigger** elements:
- **All** — Every item across all types, intermixed and sorted alphabetically. Each card shows a subtle type label (e.g. "Exercise", "Muscle Group", "Equipment").
- **Exercises** — Exercise cards only (with count).
- **Muscle Groups** — Muscle group cards only (with count).
- **Equipment** — Equipment cards only (with count).

Switching tabs filters the list below. The search query and tab filter are combined.

## 4. Exercise Cards

### Card Header

A tappable row that toggles the detail panel:
- Left column (flexible):
  - Exercise name as **CardTitle**.
  - A wrapped row of **Badge** elements:
    - Rep range **Badge** (outline, color-coded by range category).
    - One **Badge** (secondary) per primary muscle group.
- Right: expand/collapse chevron icon.

### Card Detail

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

#### e. Actions

A row at the bottom of the detail panel:
- "Edit" **Button** (outline, small) with a pencil icon.
- "Delete" **Button** (outline, small, destructive) with a trash icon.

## 5. Muscle Group Cards

### Card Header

A tappable row that toggles the detail panel:
- Left column (flexible):
  - Muscle group name as **CardTitle** (e.g. "Chest", "Quadriceps", "Rear Delts").
  - A small muted count label: "Used in X exercises".
- Right: expand/collapse chevron icon.

### Card Detail

Shown when expanded. Begins with a **Separator**.

#### a. Linked Exercises

Two grouped lists:
- "Primary in" — a list of exercise names where this muscle group is tagged as primary, each as a tappable text link.
- "Secondary in" — a list of exercise names where this muscle group is tagged as secondary, each as a tappable text link.

If either list is empty, that section is omitted.

#### b. Notes

If the muscle group has notes, a "Notes" label followed by the text.

#### c. Actions

A row at the bottom of the detail panel:
- "Edit" **Button** (outline, small) with a pencil icon.
- "Delete" **Button** (outline, small, destructive) with a trash icon. Disabled with a tooltip if the muscle group is still linked to any exercises.

## 6. Equipment Cards

### Card Header

A tappable row that toggles the detail panel:
- Left column (flexible):
  - Equipment name as **CardTitle** (e.g. "Barbell", "Cable Machine", "Resistance Band").
  - A small muted count label: "Used in X exercises".
- Right: expand/collapse chevron icon.

### Card Detail

Shown when expanded. Begins with a **Separator**.

#### a. Linked Exercises

A list of exercise names that use this equipment, each as a tappable text link.

If the list is empty, a muted "No exercises use this equipment yet" message is shown.

#### b. Notes

If the equipment has notes, a "Notes" label followed by the text.

#### c. Actions

A row at the bottom of the detail panel:
- "Edit" **Button** (outline, small) with a pencil icon.
- "Delete" **Button** (outline, small, destructive) with a trash icon. Disabled with a tooltip if the equipment is still linked to any exercises.

## 7. Empty State

When the filtered list is empty, a centered empty state: a large search icon and "No results found" text with a suggestion to try a different search or tab.
