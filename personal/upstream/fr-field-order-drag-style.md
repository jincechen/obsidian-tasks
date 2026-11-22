# Feature request: Make dragging in "Hide and reorder fields" look like Obsidian's lists

Template: **Feature Request**. Branch: `feat/field-order-drag-style` (1 commit, CSS only). This follows up #4133.

**Title:** Style dragging in the 'Hide and reorder fields' modal like Obsidian's reorderable lists

## 🔖 Feature description

While dragging a field or group in **Hide and reorder fields**, the dragged item gets only a faint hover background. Obsidian's own reorderable settings lists, such as the custom statuses, show the drop slot with an accent tint and a closed-hand cursor. The two feel different, and it's hard to see what is being moved.

## ✔️ Solution

CSS only, with no change to the modal's code:

- the dragged item gets the same accent-tinted slot as Obsidian's lists;
- the cursor is a closed hand while dragging;
- the handles are muted until hovered, like the lists' handles.

## ❓ Alternatives

Use Obsidian's list reordering itself. Its API only exists inside the settings tab, and it only reorders one level, so it can't reorder groups and fields in a modal.

## 📝 Additional Context

<!-- Attach a short screen recording of dragging, before and after. -->
