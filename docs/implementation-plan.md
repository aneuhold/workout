# MesoPro Implementation Plan

Ordered by functional dependencies — each phase unlocks the next. Phases can overlap where noted.

---

## Phase 1: Reference Data Management

**Goal:** Establish the foundational data that all other features depend on.

- Equipment types CRUD (title, weight options, weight generation via `WorkoutEquipmentTypeService.generateWeightOptions`)
- Muscle groups CRUD (name, description)
- Could be simple list/dialog UIs or a settings-style page, since these don't have dedicated routes in the mockups
- Consider seeding common defaults (e.g. "Barbell", "Dumbbell", "Cable"; "Chest", "Back", "Quads", etc.)

**Unlocks:** Exercise creation (Phase 2)

---

## Phase 2: Exercise Library (`/exercises`)

**Goal:** Let users build their exercise inventory — the building blocks of every workout.

- Exercise list with real-time search (name, muscle group, equipment)
- Filter tabs: All / Calibrated / Needs Cal.
- Expandable exercise cards (properties grid, muscle groups, notes)
- Add/edit exercise form (name, equipment type select, rep range, progression type, rest seconds, custom properties, primary/secondary muscle groups, initial fatigue guess)
- Delete exercise with confirmation
- Empty state

**Depends on:** Phase 1 (equipment types + muscle groups must exist)
**Unlocks:** Calibration (Phase 3), Session Logging (Phase 5), Mesocycle Planning (Phase 6)

---

## Phase 3: Exercise Calibration

**Goal:** Record baseline strength data so the app can calculate 1RM and auto-generate load targets.

- Calibration section within exercise detail (already in mockup)
- Add/edit calibration form (reps, weight, date, exercise properties snapshot)
- Display computed 1RM via `WorkoutExerciseCalibrationService.get1RM`
- Display target weight at various rep counts via `getTargetWeight`
- Offer to duplicate calibration to similar exercises (per system-model note)

**Depends on:** Phase 2
**Unlocks:** Accurate load recommendations in Mesocycle Planning (Phase 6)

---

## Phase 4: Rest Timer (Full Implementation)

**Goal:** Provide the in-session rest timer described in the layout mockup. Can be built in parallel with Phases 2-3.

- Timer popover on nav bar with preset durations (60s, 90s, 2m, 3m)
- Running state: nav button shows countdown, persistent timer bar at top of content area with progress bar and stop button
- Auto-stop at zero
- Integration point: exercise `restSeconds` pre-selects timer duration during session logging (Phase 5)

**Depends on:** Nothing (timer store already exists)
**Unlocks:** Better session logging UX (Phase 5)

---

## Phase 5: Session Logging (`/session/[id]`)

**Goal:** Core workout tracking — let users log sets, rate stimulus/fatigue, and complete sessions. Supports free-form sessions (no mesocycle required).

### 5a: Session Creation & Basic Structure
- Create ad-hoc session (title, exercises from library)
- Session header + progress bar
- Exercise cards with collapse/expand and visual states (current/completed/future)

### 5b: Set Logging
- Set table with weight/reps/RIR inputs
- Set row states (completed, current, future) with planned targets as placeholders
- "Log" button to mark set complete
- Timer quick-start button per set (uses Phase 4)

### 5c: Stimulus & Recovery Ratings
- RSM sliders (Mind-Muscle Connection, Pump, Disruption) — per session exercise
- Fatigue sliders (Joint & Tissue, Perceived Effort, Unused Muscle Performance) — per session exercise
- Recovery indicators (Soreness, Performance) — per session exercise
- All use shared slider pattern: 0-4 range, 0 = "Not Set", 1-4 map to scores 0-3

### 5d: Session Completion
- Session summary card (sets completed count, progress %)
- "Complete Session" button (disabled until all sets done)
- Mark session complete, persist RSM/Fatigue/Recovery to documents

**Depends on:** Phase 2 (exercises), Phase 4 (timer)
**Unlocks:** Home Dashboard pending logs (Phase 8), Analytics data (Phase 9)

---

## Phase 6: Mesocycle Planner (`/mesocycle/new`)

**Goal:** Let users design a structured training plan with auto-generated progression.

### 6a: Shared Calendar Component
- 7-column grid layout with day-of-week headers
- Microcycle boundary markers (left border on cycle start days)
- Cycle/month label rows
- Day cell types: rest, session, empty — with correct assignment logic
- Visual states for plan-new context (all future) and plan-list context (past/current/future/deload)
- Day detail dialog (date, cycle label, session exercises with projected targets)

### 6b: Configuration Form
- Title, cycle type select (Muscle Gain, Resensitization, Cut) with info popover
- Numeric config: weeks (2-8), sessions/week (2-6), days/cycle (5-10)
- Rest days toggle selector (Sun-Sat)

### 6c: Session Definitions
- Accordion list of sessions with add/remove
- Per-session: title input, exercise list with add/remove (select from library)
- Drag handle for reordering (visual-only initially, implement later if needed)

### 6d: Schedule Preview
- Shared calendar component (6a) rendered with plan-new visual states
- Reactively updates as config/sessions change

### 6e: Microcycle Progression Table
- Tabs per session, exercises listed within each tab
- Per-exercise progression table: cycle label, RIR, sets, targets (reps x weight)
- Color-coded changes relative to previous cycle
- Computed from `WorkoutMesocycleService.generateOrUpdateMesocycle` and calibration data

### 6f: Plan Summary & Creation
- Summary stats (duration, total sessions, unique exercises, cycle type)
- "Create Mesocycle" button — calls `generateOrUpdateMesocycle`, persists all generated documents (mesocycle, microcycles, sessions, session exercises, sets)

**Depends on:** Phase 2 (exercises), Phase 3 (calibrations for load targets), Phase 6a (calendar)
**Unlocks:** Mesocycle tracking (Phase 7), Home Dashboard (Phase 8)

---

## Phase 7: Mesocycle List (`/mesocycles`)

**Goal:** Show the active mesocycle with full calendar view and list past mesocycles.

- Current mesocycle card: title, cycle type badge, week progress bar
- Shared calendar component with temporal awareness (past = muted + check, current = highlighted, future = lighter, deload = dashed)
- Week progression badges (cycle labels with RIR and set modifier badges, current highlighted)
- Day detail dialog on session day tap
- Past mesocycles list (title, date range, completion count, link)

**Depends on:** Phase 6 (mesocycle data must exist)
**Unlocks:** Home Dashboard mesocycle overview (Phase 8)

---

## Phase 8: Home Dashboard (`/`)

**Goal:** The landing page — surface the most actionable items for the user.

- Mesocycle overview header (title, week counter, cycle type badge, progress bar) — from active mesocycle
- Next session card (exercise count, duration estimate, exercise badges, "Start Session" link)
- This week's sessions card (accordion list: title, "Next" badge, exercise count, sets, RIR; expanded shows exercises with set targets)
- Pending logs card (sessions missing RSM/fatigue/soreness data, links to session page)
- Recent sessions list (title, date, sets completed, RSM score)
- Quick links (Plan Mesocycle, View Analytics)
- Graceful empty states when no mesocycle is active

**Depends on:** Phase 5 (session data), Phase 7 (mesocycle data)

---

## Phase 9: Analytics (`/analytics`)

**Goal:** Visualize training progress with charts and per-muscle-group breakdowns.

### 9a: Summary Stats
- 3-card row: Avg RSM, Avg SFR, Total Sets (with trend icons)
- Computed from session exercise RSM/Fatigue data via `WorkoutSFRService`

### 9b: Volume Tab
- Stacked bar chart: weekly effective sets by muscle group
- Uses chart component (already in UI library)

### 9c: SFR Tab
- Grouped bar chart: RSM vs Fatigue per session
- SFR breakdown list with color-coded badges (>= 1.3 good, >= 1.0 ok, < 1.0 poor)

### 9d: Muscles Tab
- Per-muscle-group rows: name, trend icon, SFR value, sets current/target
- Progress bar (sets done as % of target)
- Uses `WorkoutSessionExerciseService.getRecommendedSetAdditionsOrRecovery` for progression context

**Depends on:** Accumulated session data from Phases 5+

---

## Summary

| Phase | Feature | Key Dependency |
|-------|---------|---------------|
| 1 | Equipment Types + Muscle Groups | None |
| 2 | Exercise Library | Phase 1 |
| 3 | Exercise Calibration | Phase 2 |
| 4 | Rest Timer | None (parallel with 2-3) |
| 5 | Session Logging | Phases 2, 4 |
| 6 | Mesocycle Planner | Phases 2, 3 |
| 7 | Mesocycle List | Phase 6 |
| 8 | Home Dashboard | Phases 5, 7 |
| 9 | Analytics | Phase 5+ data |

### Parallelism Opportunities
- **Phase 4** (Timer) can run in parallel with Phases 2 and 3
- **Phase 5** (Session Logging) and **Phase 6** (Mesocycle Planner) can run in parallel once Phase 2 is complete — session logging only needs exercises, while the planner also needs calibrations
- **Phase 9** (Analytics) can start as soon as Phase 5 ships and test data accumulates
