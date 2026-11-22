# Comment for issue #3449 ("Show Tree Filter")

Post as a comment on <https://github.com/obsidian-tasks-group/obsidian-tasks/issues/3449>. Open a **draft** PR only after the maintainer replies.

---

I have a working implementation of the rule jordannfc described, and would like to open it as a draft PR if that's still welcome.

**Behaviour:** with `show tree`, only subtasks that match the query are shown. A parent that doesn't match is still shown, dimmed, to give its matching subtasks context.

Here is how it handles the edge cases you raised:

- **Data loss / `on-completion: delete`:** a dimmed parent can still be completed or edited, and its hidden subtasks aren't shown. Deleting the parent line on completion would make those hidden subtasks become children of whatever is above them. One option is to make the dimmed context-only parents read-only (no checkbox, edit or postpone). Which would you prefer?
- **Grouping:** a parent is shown in every group that contains one of its matching subtasks. It is placed by its children's group, not by its own fields.
- **Counts and `limit`:** these count only tasks that match. Dimmed parents are extra, and are not counted.
- **Columns layout:** context-only parents can't be dragged.

Tests cover nested and multi-level trees, grouping, and parents that match themselves.
