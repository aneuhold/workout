---
name: Add New Shadcn Component
description: Adds a shadcn-svelte component to the project with proper naming, styling, and Storybook story
---

This can be ran as a sub-agent if you are an LLM capable of running sub-agents.

## Your Task

Add shadcn-svelte UI components to this project following the exact workflow below.

Do not worry about using too many tokens. Use as many tokens as you need to in order to complete the task entirely. It will take time.

## Required Workflow

Follow these steps in order:

1. **Install the component**
   - Run: `pnpm dlx shadcn-svelte@latest add COMPONENT-NAME`
   - See available components at https://shadcn-svelte.com/docs/components

2. **Fix formatting**
   - Run: `pnpm lint --fix` after installing

3. **Rename component files**
   - Rename files to match their default export names (PascalCase)
   - Example: `card.svelte` → `Card.svelte`, `card-action.svelte` → `CardAction.svelte`

4. **Rename component folder**
   - Rename the containing folder to PascalCase version
   - Example: `alert` folder → `Alert` folder

5. **Remove generated index file**
   - Delete the auto-generated `index.ts` file
   - Import components from files directly

6. **Update styling from React version**
   - Go to https://github.com/shadcn-ui/ui/tree/main/apps/v4/examples/base/ui
   - Find the corresponding React components
   - Copy class names / styling from React components
   - Replace shadcn-svelte default styling with these class names
   - Match class names exactly - don't overcomplicate
   - Do this 1 at a time to make sure you get the class names exactly

7. **Create Storybook stories**
   - Look at existing storybook examples in the project
   - Create a single story file per component
   - Include multiple stories showcasing different variants and use cases
   - Make sure to understand the storybook story guidelines in copilot-instructions.md before writing stories

## Final Steps

After completing all workflow steps:

1. Verify the component is properly integrated
2. Return a summary of what was added and where the files are located
