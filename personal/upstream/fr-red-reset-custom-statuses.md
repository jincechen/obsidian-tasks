# Feature request: Show "Reset custom status types to defaults" in red

Template: **Feature Request**. Branch: `feat/red-reset-custom-statuses` (1 commit).

**Title:** Show the "Reset custom status types to defaults" setting in red, as a destructive action

## 🔖 Feature description

In **Settings → Task statuses**, "Reset custom status types to defaults" looks like every other clickable row. One click discards all custom statuses immediately, so it's easy to click by accident.

## ✔️ Solution

Show its name in the theme's error colour (`--text-error`, red in the default theme), as Obsidian does for destructive actions. Nothing else changes.

## ❓ Alternatives

Ask for confirmation before resetting. This could be done as well, and would make a separate request.

## 📝 Additional Context

<!-- Attach a before/after screenshot. -->
