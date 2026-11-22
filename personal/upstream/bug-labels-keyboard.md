# Bug report: Accessibility problems in the edit dialog and query results

Template: **Bug Report**. Post this later, after PR 2 and PR 3. It may be better as two small reports: one for the edit dialog, one for keyboard access.

**Title:** Edit dialog labels point to the wrong fields, and query result buttons can't be used from the keyboard

## Steps to reproduce

1. Open **Create or edit task**. Click the labels **Status**, **Before this** and **After this**, or inspect them with a screen reader.
2. Inspect the date fields: each date picker has the same `id`.
3. In a query result, press Tab to move to the edit (pencil) or postpone buttons, then press Enter.

## Expected Behavior

- Each label focuses its own field.
- Every field has a unique id and an accessible name.
- Result buttons can be reached with Tab and used with Enter, and screen readers announce them.

## Current behaviour

- Some labels' `for` attributes point to ids that don't exist.
- All date pickers share `id="date-editor-picker"`.
- The result buttons are `<a>` elements with no `href` or `role`, so they can't be reached with the keyboard and have no accessible name.

## Possible solution

Give each date picker a unique id and an `aria-label`, and fix the labels' `for` targets. Give the result buttons `href="#"`, `role="button"` and an `aria-label` taken from their title. I have fixes with tests ready.
