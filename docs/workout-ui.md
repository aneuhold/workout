# Current Workout UI Design Requirements

## Overall

- Mobile first, but flows nicely into desktop view, especially for things like analytics

## Persistent Action Bar at the bottom

This will be a fixed action bar at the bottom when inside the app. When in desktop width, it should move to the left. Yet to be decided what it should contain, but probably the most important buttons / touch targets.

## Timer

There should be a way to start a timer while resting. So it should be accessible when looking at the session logging screen somehow. Also it should be persistent somehow in the UI if a timer is running no matter where you are currently in the app. The timer itself should be dirt-simple for the most part. We don't need anything complicated.

## Routes

### Home page

Things that seem good on this page:

- Call to action for logging a session (probably the next session)
- Call to action for any pending logs that are needed for a previous session
- Quick navigation for a few previous sessions

### Analytics

### Exercise Library / Exercises (Route name up for debate / decision)

- This should contain the list of exercises the user has, and their associated calibrations somehow. If an exercise hasn't been calibrated, it should be easily viewable here.

### Session Logging

- Sliders are needed for the SFR + Soreness + Performance, etc. values to make it easy to adjust them. The first value of the slider (all the way to the left) should indicate "Not Set". Then the next values should proceed 0-3, with 3 at the far right. 3 can be good or bad depending on the thing being measured. So if you feel like doing color indicators, then go ahead for this.
- A clear indication somehow of the current set and current session exercise being logged / worked. Maybe heart-beat animation or something cool, but still easy on the eyes.
- The full session should be in one scrollable view while recording. Try to make the controls in this UI intuitive to enable this. Do not add pagination for this route.
- Progress bar could be nice on this route somewhere to indicate progress through the session.

## Other functionality that needs to exist somehow

- Mesocycle planning. This needs to provide some kind of an interactive calendar view so that as exercises are chosen for the cycle, and configuration is adjusted for the cycle, it updates in real-time based on selections. The UI does not need to do this in the mockup, but the calendar view and functionality "in-theory" should be there where it shows visually how it could work for the user. Completely up for debate on how this should work in practice.
