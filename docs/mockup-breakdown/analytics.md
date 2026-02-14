# Analytics (`/analytics`)

The analytics page presents training data through summary stats, charts, and per-muscle-group breakdowns. Content is organized behind tabs so only one chart section is visible at a time.

## 1. Page Title

"Analytics" heading.

## 2. Summary Stats Row

A 3-column grid of small **Card** elements. Each card contains **CardContent** centered vertically:

- A trend icon (trending-up, trending-down, or neutral dash) with color indicating the direction.
- A large value with optional subtext (e.g. "6.8" with "/9").
- A muted label below.

The three stats:
| Stat | Description |
|---|---|
| Avg RSM | Average Raw Stimulus Magnitude across sessions (out of 9) |
| Avg SFR | Average Stimulus-to-Fatigue Ratio |
| Total Sets | Total sets completed this week |

## 3. Tab Bar

A **Tabs** component with a full-width **TabsList** containing three **TabsTrigger** elements:
- **Volume** — Weekly set volume chart.
- **SFR** — Stimulus-to-fatigue analysis.
- **Muscles** — Per-muscle-group breakdown.

The tabs control which content section below is visible. Only one is shown at a time.

## 4. Volume Tab Content

A **Card** containing:

- **CardHeader**: "Weekly Volume by Muscle Group" title, description explaining it shows effective sets per week.
- **CardContent**: A **ChartContainer** wrapping a stacked **BarChart**.
  - X-axis: week labels (W1, W2, ...).
  - Series: one stacked segment per muscle group (Chest, Back, Legs, Shoulders, Arms).
  - The chart has a legend and tooltip (**ChartTooltip**).

## 5. SFR Tab Content

Two cards stacked vertically.

### RSM vs Fatigue Chart Card

**Card** containing:

- **CardHeader**: "RSM vs Fatigue by Session" title, description explaining the SFR relationship.
- **CardContent**: A **ChartContainer** wrapping a grouped **BarChart**.
  - X-axis: session names.
  - Two bars per session: RSM and Fatigue.
  - Legend and tooltip.

### SFR Breakdown List Card

**Card** containing:

- **CardHeader**: "SFR by Session" title.
- **CardContent**: A vertical list of rows, one per session.
  - Each row: session name on the left, RSM and Fatigue values as muted text, and an SFR **Badge** on the right.
  - Badge variant depends on SFR value:
    - >= 1.3: default (good).
    - >= 1.0: secondary (acceptable).
    - < 1.0: destructive (poor).

## 6. Muscles Tab Content

A **Card** containing:

- **CardHeader**: "Muscle Group Progress" title, description about weekly set volume vs target.
- **CardContent**: A vertical list of muscle group rows separated by **Separator** elements.

### Muscle Group Row

Each row contains:
- A header line: muscle name (left), trend icon with direction color, SFR value (muted), and "current/target" count (right).
- A custom progress bar below: a muted track with a filled segment. The fill width represents sets done as a percentage of the target. The fill changes appearance when the target is fully met.
