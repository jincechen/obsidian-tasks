# Bug report: Result buttons cannot be used from the keyboard

Template: **Bug Report**. Branch: `fix/result-buttons-keyboard`. Post this later, after PR 2 and PR 3. Related: #1478 (keyboard access to the edit button; closed with no answer) and discussion #3620 (navigating search results with the keyboard).

**Title:** Edit and postpone buttons in query results can't be used from the keyboard

## Steps to reproduce

In a query result, press Tab to move to the edit (pencil) or postpone buttons, then press Enter.

## Expected Behavior

The buttons can be reached with Tab and used with Enter, and screen readers announce them.

## Current behaviour

The buttons are `<a>` elements with no `href` or `role`, so they can't be reached with the keyboard and have no accessible name.

## Possible solution

Give the buttons `href="#"`, `role="button"`, and an `aria-label` taken from their title. I have a fix with tests ready.
