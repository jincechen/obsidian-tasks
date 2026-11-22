# Bug report: Edit dialog labels point to the wrong fields

Template: **Bug Report**. Branch: `fix/edit-dialog-labels`. Post this only after PR #4135 (native date pickers) merges: its tests use the id `date-editor-picker`, which this fix changes. PR #4145 also edits this dialog. No existing issue covers it.

**Title:** Labels in the 'Create or edit Task' dialog point to the wrong fields

## Steps to reproduce

1. Open **Create or edit task**.
2. Click the labels **Status**, **Before this** and **After this**, or inspect them with a screen reader.
3. Inspect the date fields.

## Expected Behavior

Each label focuses its own field, and every field has a unique id and an accessible name.

## Current behaviour

- Some labels' `for` attributes point to ids that don't exist.
- All date pickers share `id="date-editor-picker"`.

## Possible solution

Give each date picker a unique id and an `aria-label`, and fix the labels' `for` targets. I have a fix with tests ready.
