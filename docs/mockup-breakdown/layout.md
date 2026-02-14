# Root Layout

The root layout is the persistent shell around all pages. It handles the app loading/login gate, responsive navigation, and the rest timer.

## Loading / Login Gate

Before the app is ready, a centered loading message is shown. If the user is logged out or processing credentials, a login prompt is shown instead. All content below only renders once the app is mounted and logged in.

## Navigation Shell

The layout is a responsive two-mode navigation shell:

- **Mobile**: Page content fills the screen. A fixed bottom navigation bar sits at the bottom edge.
- **Desktop**: A narrow sidebar sits on the left. Page content fills the remaining space.

Both the sidebar and bottom bar contain the same set of navigation links plus a timer button. The active route is visually distinguished from inactive routes.

### Navigation Items

| Label | Route | Icon |
|---|---|---|
| Home | `/` | Home |
| Session | `/session/demo` | Barbell |
| Exercises | `/exercises` | List |
| Analytics | `/analytics` | Chart |
| Plan | `/plan` | Calendar |

Each nav item is a vertically stacked icon + label. The current route is highlighted.

### Primitives used

The nav links are plain anchor elements (not Button components). The shell uses no Card or other compound primitives — just layout containers.

## Rest Timer

The timer is accessible from the navigation bar (both mobile and desktop). It has two states:

### Idle State

The timer button in the nav shows a clock icon and "Timer" label. Tapping it opens a quick-start popover.

**Timer Popover** — A floating panel near the timer button with:
- A "Rest Timer" heading
- A row of preset duration Buttons (60s, 90s, 2m, 3m)
- Tapping a preset starts the timer and closes the popover

Primitives: **Button** (outline, small) for each preset.

### Running State

When the timer is running:

1. **Nav button** — The timer button in the nav replaces the "Timer" label with a live countdown (monospace). The clock icon pulses.

2. **Persistent timer bar** — A bar appears at the top of the main content area (visible on all pages). It contains:
   - A pulsing clock icon
   - A **Progress** bar showing elapsed time as a percentage of total duration
   - The remaining time as a countdown (monospace)
   - A stop **Button** (ghost, icon-only) to cancel the timer

When the timer reaches zero it auto-stops. The timer bar disappears and the nav button returns to idle state.

## Main Content Area

Below the timer bar (or at the top if no timer is running), the page content renders in a scrollable region. On mobile the content has bottom padding to clear the fixed nav bar.
