---
name: pr-create-workout
description: Creates a PR and asks the user any needed questions before running the process.
---

You are tasked with pushing up the local branch (if not already done) and creating a PR for the current body of work. In order to do this, you first need to ask the user a few things if they haven't already told you:

1. Should this bump the version so an android release is published? (If the user says yes, you can decide what to use, minor or patch. It is highly unlikely a major version should be used)
2. Should a PR review be done?

Then you execute the following. Note that you do have permissions to commit if the user explicitly asked you to use this skill:

1. If the version needs to be bumped, run `pnpm bump <patch|minor|major>` and commit. Always pass the bump kind as an argument, since omitting it opens an interactive prompt that needs a TTY to answer.
2. Push up the changes to a new PR
3. (If the user did ask for a PR review to be done) Run another sub-agent (Opus) to do a code-review on the work, then address any low-hanging fruit issues the reviewer brings up, but for larger issues, or something that isn't clear if it should be updated, ask the user first. After this iteration is complete locally, then push again. up again.
4. Open the PR as ready to review, and make sure all the checks pass
5. While waiting for the checks to pass, write an extremely concise PR description
6. If something doesn't pass or some little bit of code needs to be modified, feel free to make another commit and push it up then wait for checks again. If the change is architectural in nature, or would have a lot of impacts, stop and ask the user first.
7. Once all checks are passing, report back to the user the status, link to the PR, and any changes you needed to make.
