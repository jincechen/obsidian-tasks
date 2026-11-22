# Next steps

State on 2026-11-21:

- `main` matches upstream 8.6.0+ (9fecdd678).
- `personal` is `main`, plus the 12 upstream-bound branches merged in, plus personal-only commits.
- All of it is pushed to your fork.
- The old versions of every branch are kept as `archive/2026-11-21/*` tags.

## 1. Test your personal build

```bash
node personal/deploy.mjs "path/to/vault"
```

These have unit tests, but they haven't been tried in Obsidian:

- [x] **Status settings page:** compare with your old screenshot. Check the filter, the "+" button, ×, dragging rows, the Tools list, and Reset (red, and asks for confirmation).
- [x] **Icons** (Settings → Display → Property style): results, Reading mode, the edit dialog, auto-suggest, Quick Search, menus, and the settings descriptions.
- [x] **Live Preview** compact properties, and clicking a date to pick one (native date picker).
- [ ] **Edit dialog:**
  - "Blocked by" and "Blocks" labels;
  - the options button beside the close button;
  - priority options listed Highest → Lowest;
  - dragging in **Hide and reorder fields** shows the tinted slot.
- [ ] **Postpone button:** it sits after the date it postpones, which upstream's new **Postpone button** setting chooses.
- [ ] **Subtask progress** (Settings → Display) and its popup; `show tree` showing only the matching subtasks; `sort by readiness`.
- [ ] **Toggle task statuses** (renamed from "Toggle task done"): try it on a multi-line selection; non-task lines are skipped.
- [ ] **Search box:** type quickly in a query's search box. Results must never show twice.

## 2. Order of the upstream PRs

**One change per PR.** Don't bundle branches together: the contributing guide allows one fix, one feature or one refactor per PR. What you can batch is the timing: work in waves, and keep at most 2–3 issues or PRs open at once.

The order follows three rules:

1. **Build trust:** start with tiny fixes, then features.
2. **Avoid conflicts:** a branch that touches the same files as another goes after it.
3. **Most agreed first:** features the maintainer already welcomed go before new ideas.

`feat/property-icons` touches the same code as five other branches, so it goes last and adapts to them.

| Wave | # | Branch | First, on GitHub | Why here |
| --- | --- | --- | --- | --- |
| 1, now | 1 | `test/mock-data-loader-windows` | nothing: `test:` PRs need no issue | 4 lines; shows you follow the rules |
| 1, now | — | — | post [bug-retry-notices](upstream/bug-retry-notices.md) and [bug-inferred-date-menu](upstream/bug-inferred-date-menu.md) | gets the next two PRs agreed |
| 2 | 2 | `fix/file-retry-notices` | bug report acknowledged | tiny, clear bug |
| 2 | 3 | `fix/inferred-scheduled-date-menu-item` | bug report acknowledged | tiny; must land before icons, which touch the same menus |
| 3 | 4 | `fix/query-results-shown-twice` | [bug report](upstream/bug-results-shown-twice.md) with a video, as Clare asked | visible bug; small fix |
| 3 | 5 | `fix/edit-dialog-labels` | [bug report](upstream/bug-edit-dialog-labels.md) | before icons (same date editor) |
| 3 | 6 | `fix/result-buttons-keyboard` | [bug report](upstream/bug-result-buttons-keyboard.md) | before tree and icons (same renderer and test outputs) |
| 4 | 7 | `feat/tree-matching-subtasks` | [comment on #3449](upstream/comment-3449-show-tree.md); Clare invited a draft PR | already welcomed |
| 4 | 8 | `feat/subtask-progress` | [feature request](upstream/fr-subtask-progress.md) | Clare said "sounds good"; creates the Display group that icons reuse |
| 5 | 9 | `feat/red-reset-custom-statuses` | [feature request](upstream/fr-red-reset-custom-statuses.md) | 1 small commit; fits any lull |
| 5 | 10 | `feat/field-order-drag-style` | [feature request](upstream/fr-field-order-drag-style.md) | CSS only; a follow-up to #4133 |
| 5 | 11 | `feat/sort-by-readiness` | [feature request](upstream/fr-sort-by-readiness.md) | a new idea; independent of the others |
| 6 | 12 | `feat/property-icons` | [feature request](upstream/fr-property-icons.md) | largest; overlaps 5 branches, so last. Offer it as one PR with commits per area, or as several PRs if Clare prefers |

**Before opening each PR,** ask Claude to refresh the branch on the latest upstream `main` and re-run the checks. The branch isn't public as a PR yet, so that is allowed.

**Once a PR is open,** never rebase or force-push its branch. If a maintainer asks for changes, add commits, then run `git switch personal && git merge <branch>`. Answer review comments within a week.

To open a PR:

```bash
gh pr create --repo obsidian-tasks-group/obsidian-tasks --base main --head jincechen:<branch> --web
```

Use the template GitHub shows, keeping every section. Ready-made texts for PRs 1–3 are in [upstream/pr-descriptions.md](upstream/pr-descriptions.md).

## 3. Every change, and which version has it

**Both** means the change is on an upstream-bound branch and merged into `personal`. **Personal** means it's a commit on `personal` only. New changes go on a branch by default, so that both versions get them.

| Change | Version | Branch or note |
| --- | --- | --- |
| MockDataLoader path test passes on Windows | Both | `test/mock-data-loader-windows` |
| No notice on every retry of a task edit | Both | `fix/file-retry-notices` |
| Inferred scheduled date's "remove" item disabled in menus | Both | `fix/inferred-scheduled-date-menu-item` |
| Query results never show twice while redrawn | Both | `fix/query-results-shown-twice` |
| Edit dialog labels and ids point to the right fields | Both | `fix/edit-dialog-labels` |
| Result buttons usable from the keyboard | Both | `fix/result-buttons-keyboard` |
| `show tree` shows only matching subtasks, with dimmed parents | Both | `feat/tree-matching-subtasks` |
| Subtask progress bar, `hide progress`, middle layers, in a Display group | Both | `feat/subtask-progress` |
| `sort by readiness` | Both | `feat/sort-by-readiness` |
| Property style: icons in results, Reading mode, dialog, auto-suggest, Quick Search, menus and settings | Both | `feat/property-icons` |
| "Reset custom status types" shown in red | Both | `feat/red-reset-custom-statuses` |
| Dragging in "Hide and reorder fields" styled like Obsidian's lists | Both | `feat/field-order-drag-style` |
| Native date input instead of flatpickr | Personal | upstream PR #4135 does this; keep upstream's once it merges |
| Task properties shown compactly in Live Preview | Personal | possible feature request later; Clare invited one |
| Click a date in Live Preview to pick it | Personal | possible feature request later; Clare called it "a PR in its own right" |
| Postpone button next to the date it postpones | Personal | possible feature request later |
| Edit dialog: "Blocked by"/"Blocks", options button beside close, alignment, priority order, wording | Personal | your taste; upstream's field order is used |
| Status page look: symbol, name, type and "Next →" chips, drag to reorder, Tools list | Personal | your design, on upstream's settings code |
| Confirm before resetting custom statuses | Personal | could go upstream with the red-reset request |
| Reorder and reword the status edit dialog | Personal | your taste |
| Reject a status symbol that another status already uses | Personal | could be a bug report later |
| Confirm before deleting a preset | Personal | could go upstream later |
| Require a query when adding or editing a preset | Personal | could be a bug report later |
| Settings wording polish | Personal | your taste |
| Toggle every task in a multi-line selection | Personal | upstream discussion #1160; not agreed yet |
| "Toggle task done" renamed "Toggle task statuses" | Personal | Clare noted that renaming breaks command palette search |
| Clearer notices, tooltips and menu labels | Personal | your taste |
| Dataview suggestions only inside `[]` | Personal | could be a bug report later (regression of #2204?) |
| No copy button in query results | Personal | Clare uses the copy button, so it stays personal |
| The personal build itself (`personal/`) | Personal | never upstream |

## 4. Watch upstream

- **PR #4135** (native date pickers, by another contributor): when it merges, the next `git merge main` into `personal` will conflict with your own native date picker commit. Keep upstream's version.
- **Once an upstream PR of yours merges:** delete its branch locally and on the fork, and change its row above to "upstream":

  ```bash
  git branch -d <branch>
  git push origin --delete <branch>
  ```
