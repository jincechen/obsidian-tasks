# Bug report: "Cannot remove inferred scheduled date" menu item can be clicked

Template: **Bug Report**.

**Title:** "Cannot remove inferred scheduled date" menu item is clickable but does nothing

## Steps to reproduce

1. Enable **Use filename as Scheduled date for undated tasks** in the Tasks settings.
2. Create a note named `2026-11-21.md` containing:

   ```text
   - [ ] task with inferred scheduled date
   ```

3. In another note, add:

   ````text
   ```tasks
   description includes inferred scheduled date
   ```
   ````

4. In the query results, right-click the scheduled date to open its menu.
5. Also right-click the postpone button (⏩) to open its menu.

## Expected Behavior

In both menus, the item "Cannot remove inferred scheduled date" is shown disabled (greyed out).

## Current behaviour

In both menus the item looks clickable.

- **Date menu:** clicking it does nothing.
- **Postpone menu:** clicking it shows a "removed" success notice. Nothing changes in the file, and the date is inferred again from the file name.

## Possible solution

Add `isEnabledForTask(task)` to the editing instructions (default `true`; `RemoveTaskDate` returns `false` for an inferred scheduled date), and disable the item in `TaskEditingMenu` and `PostponeMenu`. I have a fix with tests ready.
