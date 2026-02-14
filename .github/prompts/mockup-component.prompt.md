---
name: Mockup Component Generator
description: Create a mockup of a component or page with Storybook stories using mock data, without hooking into the real UI.
---

Create a mockup component and associated Storybook stories for the requested component or page. Use mock/fake data only — do not hook into the real UI or backend.

## Instructions

1. **Determine if the component already exists** in the project under `src/components/`.

2. **If the component does NOT exist:**
   - Create a new folder under `src/components/` following existing naming conventions (e.g., `src/components/ui/<ComponentName>/` for UI components, `src/components/<FeatureName>/` for feature/page components).
   - Create the component as `<ComponentName>.svelte`.
   - Create a Storybook example wrapper as `SB<ComponentName>Example.svelte`.
   - Create the stories file as `<ComponentName>.stories.svelte`.

3. **If the component DOES exist:**
   - Place the alternate design in the same folder as the original component.
   - Name it `<ComponentName>.AltDesign<IterationNum>.svelte` where `<IterationNum>` is the next available number (starting at 1).
   - Create a separate Storybook example wrapper as `SB<ComponentName>AltDesign<IterationNum>Example.svelte`.
   - Create a separate stories file as `<ComponentName>.AltDesign<IterationNum>.stories.svelte`.

4. **Storybook stories should:**
   - Use the Svelte CSF format with `@storybook/addon-svelte-csf` and `defineMeta`.
   - Import utility functions from `$storybook/storybookUtil` (e.g., `createTextArgTypes`, `createBoolArgTypes`, `createNumberArgTypes`).
   - Use the `SB*Example.svelte` wrapper as the component in `defineMeta`.
   - Follow existing title conventions: `'UI Components/<Name>'` for UI components, `'Components/<Name>'` for feature components. Append `' Alt Design <IterationNum>'` to the title for alternate designs.
   - Include at least a default story and any relevant variant stories.

5. **If it would help communicate the mockup**, feel free to create an example usage component (e.g., `SB<ComponentName>Example.svelte`). See `src/components/ui/Popover/SBPopoverExample.svelte` for a reference of this pattern.

6. **Use mock data only.** Do not import or connect to any stores, services, or API calls. Hardcode realistic-looking fake data directly in the component or example wrapper.
