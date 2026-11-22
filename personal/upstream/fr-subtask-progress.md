# Feature request: Optional subtask progress on parent tasks

Template: **Feature Request**. Post this one first: the maintainer said "Sounds good" about it in #4048. Link #3319, which was closed earlier.

**Title:** Optionally show progress of subtasks after a parent task

## 🔖 Feature description

When a task has subtasks, there is no way to see how far along they are without expanding the list. #3319 asked for a count of subtasks. In #4048 you said this sounded good, but that there was no Feature Request for it. This is that request.

## ✔️ Solution

An optional setting, **off by default**, that shows a slim progress bar and a count such as `2/5` after any task with subtasks. It appears in search results and in Live Preview.

Answers to the counting questions raised in #3319:

- **Nested subtasks:** every descendant task counts, not only direct children.
- **Done:** done subtasks count as complete.
- **Cancelled:** cancelled subtasks are left out of both numbers.
- **Non-task items:** plain list items (non-task bullets) are ignored.
- **Per query:** `hide progress` turns it off for a single query. It fits the existing `hide …` layout options.

Possible later step, only if wanted: the settings choose which status counts as "complete", and up to two paler "middle" layers, for example to show in-progress subtasks.

## ❓ Alternatives

- The Task Progress Bar plugin, but it does not work inside Tasks query results.
- Dataview scripts, which most users don't want to maintain.

## 📝 Additional Context

I have a working implementation with tests and docs, and can split it into small PRs: the count and bar first, then `hide progress`, then the optional layers.
<!-- Attach a screenshot of the progress bar from your personal build. -->
