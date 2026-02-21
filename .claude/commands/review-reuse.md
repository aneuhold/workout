Review the current branch's changes against `main` for code duplication and missed reuse opportunities.

## Steps

1. **Get the diff**: Run `git diff main...HEAD` to see all changes on the current branch. Also run `git diff` and `git diff --cached` to capture any uncommitted work.

2. **Identify new/changed code**: Focus on newly added functions, components, utility logic, constants, type definitions, and CSS patterns.

3. **Search for duplication and reuse opportunities**: For each significant piece of new code, search the rest of the codebase (using Grep and Glob) for:
   - **Exact or near-duplicate logic** — similar functions, repeated patterns, copy-pasted blocks
   - **Existing utilities or helpers** that already do what the new code does (check `$util`, `$services`, `$components/ui`, `$stores`, and `@aneuhold/core-ts-db-lib`)
   - **Similar UI components** that could be generalized or reused instead of creating new ones
   - **Repeated Tailwind class combinations** that suggest a shared component or `cn()` pattern would be cleaner
   - **Constants or config values** that are duplicated across files

4. **Report findings**: For each issue found, provide:
   - The new code location (file + line range)
   - The existing code it duplicates or could reuse (file + line range)
   - A brief suggestion for how to consolidate

If no issues are found, say so — don't fabricate problems. Be concise and actionable.
