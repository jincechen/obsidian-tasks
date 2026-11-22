# Bug report: A notice pops up on every retry when editing a task

Template: **Bug Report**. Tick the checkboxes after you check them yourself. Related: #3267 (the underlying cause, still open) and #2130 (the same notices piling up on Canvas cards).

**Title:** A "Retrying ..." notice pops up on every retry while a task edit is waiting for Obsidian's cache

## Steps to reproduce

<!-- TODO before posting: confirm these steps in your vault with the official plugin. Record a short screen recording if you can. -->

1. Create a note `Retry test.md` containing:

   ```text
   - [ ] retry test task
   ```

2. In another note, add this query:

   ````text
   ```tasks
   description includes retry test
   ```
   ````

3. Rename or move `Retry test.md`, then **immediately** tick the task's checkbox in the query results, before Obsidian has re-indexed the file.

## Expected Behavior

Tasks retries quietly. A notice appears only if the edit finally fails. Upstream already shows one for that case: "Could not find the correct task line to update".

## Current behaviour

Every retry shows its own notice, for example "Tasks: No file cache found for file … Retrying ...". Tasks retries up to 10 times, so several notices can stack up even when the edit then succeeds.

## Possible solution

In `src/Obsidian/File.ts`, `tryRepetitive()` calls `warnAndNotice(e.message)` for each `WarningWorthRetrying`. Logging these with `console.warn` instead, and keeping the existing notice for the final failure, fixes it. I have a fix with a test ready.
