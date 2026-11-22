# Next steps

State on 2026-11-21:

- `main` matches upstream 8.6.0+ (9fecdd678).
- `personal` is `main`, plus the 12 upstream-bound branches merged in (a 13th, multi-line Toggle, is planned), plus personal-only commits.
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
- [x] **Edit dialog:**
  - "Blocked by" and "Blocks" labels;
  - the options button beside the close button;
  - priority options listed Highest → Lowest;
  - dragging in **Hide and reorder fields** shows the tinted slot.
- [x] **Postpone button:** it sits after the date it postpones, which upstream's new **Postpone button** setting chooses.
- [x] **Subtask progress** (Settings → Display) and its popup; `show tree` showing only the matching subtasks; `sort by readiness`.
- [x] **Toggle task statuses** (renamed from "Toggle task done"): try it on a multi-line selection; non-task lines are skipped.
- [x] **Search box:** type quickly in a query's search box. Results must never show twice.

## 2. Order of the upstream PRs

**One change per PR.** The contributing guide allows one fix, one feature or one refactor per PR, so don't bundle branches together. Batch the timing instead: work in waves, and keep at most 2–3 issues or PRs open at once.

The order follows three rules:

1. **Build trust:** tiny fixes before features.
2. **Avoid conflicts:** a branch that touches the same files as another goes after it. `feat/property-icons` overlaps five branches, so it goes last.
3. **Most agreed first:** features the maintainer already welcomed go before new ideas.

Issue numbers are on obsidian-tasks-group/obsidian-tasks.

| Wave | # | Branch | First, on GitHub | Related upstream | Why here |
| --- | --- | --- | --- | --- | --- |
| 1, now | 1 | `test/mock-data-loader-windows` | nothing: `test:` PRs need no issue | none; Windows fixes were accepted before (#3337, #3029) | 4 lines; shows you follow the rules |
| 1, now | — | — | post [bug-retry-notices](upstream/bug-retry-notices.md) and [bug-inferred-date-menu](upstream/bug-inferred-date-menu.md) | | gets the next two PRs agreed |
| 2 | 2 | `fix/file-retry-notices` | bug report acknowledged | #3267 (cause, open), #2130 | tiny, clear bug |
| 2 | 3 | `fix/inferred-scheduled-date-menu-item` | bug report acknowledged | #2650 and PR #2844: the item is **intentional** | frame it as "keep the item, show it disabled"; lands before icons, which touch the same menus |
| 3 | 4 | `fix/query-results-shown-twice` | [bug report](upstream/bug-results-shown-twice.md) with a video, as Clare asked | #3893 (closed, couldn't reproduce), #4105 / #4106 | your test reproduces it on current `main` |
| 3 | 5 | `fix/result-buttons-keyboard` | [bug report](upstream/bug-result-buttons-keyboard.md) | #1478 (closed, no answer), discussion #3620 | before tree and icons (same renderer and test outputs) |
| 4 | 6 | `feat/tree-matching-subtasks` | [comment on #3449](upstream/comment-3449-show-tree.md) | #3449 (draft invited, edge cases matter), #3417, discussion #3265 | already welcomed |
| 4 | 7 | `feat/subtask-progress` | [feature request](upstream/fr-subtask-progress.md) | #3319 (not planned), PR #4048 ("sounds good") | creates the Display group that icons reuse |
| 4 | 8 | multi-line Toggle (branch to be cut) | comment on discussion #1160 | discussion #1160 (16 upvotes, "a great idea"), #3879, PR #4123 | agreed in principle; Clare asked for careful recurring-task testing |
| 5 | 9 | `fix/edit-dialog-labels` | [bug report](upstream/bug-edit-dialog-labels.md), **after PR #4135 merges** | none; PR #4135 uses the id this fix renames, and PR #4145 edits the same dialog | waits for #4135 |
| 5 | 10 | `feat/red-reset-custom-statuses` | [feature request](upstream/fr-red-reset-custom-statuses.md) | #2353, #2358 | 1 small commit; can offer the reset confirmation too |
| 5 | 11 | `feat/field-order-drag-style` | [feature request](upstream/fr-field-order-drag-style.md) | #1334, PR #4133 | CSS only; a follow-up to #4133 |
| 5 | 12 | `feat/sort-by-readiness` | [feature request](upstream/fr-sort-by-readiness.md) | #2655, discussions #1257, #698 and #1162, #2344 (wontfix) | a new idea; urgency changes have often been declined |
| 6 | 13 | `feat/property-icons` | [feature request](upstream/fr-property-icons.md) | #1737 (not planned), discussion #1965, PR #4048 (FR invited) | largest; overlaps 5 branches. Offer one PR with commits per area, or several PRs |

**Personal-only changes worth contributing later** (section 3 has the reasons). Each needs its own branch from `main`; ask Claude to cut it when you get there:

- **Strong:** multi-line Toggle (#1160); rejecting a duplicate status symbol (a small fix, near #2357).
- **Reasonable:**
  - confirmation before resetting statuses and deleting a preset (together, alongside the red reset);
  - dragging to reorder custom statuses (small, but Clare once suggested naming statuses in order instead, #2026);
  - requiring a query in a preset (small fix; needs a bug report showing the problem);
  - "Blocked by"/"Blocks" labels (#3605 shows people misread them; after #4135 and #4145).
- **Later, as feature requests:** compact task properties in Live Preview (invited in #4048; after icons); click a date in Live Preview (after #4135).
- **Instead of a change:** rather than removing the copy button, consider fixing open issue #4073 (the copy button overlaps "Edit this block").

**Before opening each PR,** ask Claude to refresh the branch on the latest upstream `main` and re-run the checks. This is allowed because the branch isn't open as a PR yet.

**Once a PR is open,** never rebase or force-push its branch. If a maintainer asks for changes, add commits, then run `git switch personal && git merge <branch>`. Answer review comments within a week.

To open a PR:

```bash
gh pr create --repo obsidian-tasks-group/obsidian-tasks --base main --head jincechen:<branch> --web
```

Use the template GitHub shows, keeping every section. Ready-made texts for PRs 1–3 are in [upstream/pr-descriptions.md](upstream/pr-descriptions.md).

## 3. Every change, which version has it, and whether to contribute it

- **Both:** on an upstream-bound branch and merged into `personal`.
- **Personal:** a commit on `personal` only.

New changes go on a branch by default, so that both versions get them.

| Change | Version | Related upstream | Contribute? |
| --- | --- | --- | --- |
| MockDataLoader path test passes on Windows | Both | none | yes: PR 1 |
| No notice on every retry of a task edit | Both | #3267, #2130 | yes: PR 2 |
| Inferred scheduled date's "remove" item shown disabled | Both | #2650, PR #2844 (intentional item), #1947 | yes: PR 3, framed as polish |
| Query results never show twice while redrawn | Both | #3893, #4105 / #4106 | yes, with a video |
| Edit dialog labels and ids point to the right fields | Both | PR #4135 conflicts | yes, after #4135 |
| Result buttons usable from the keyboard | Both | #1478, discussion #3620 | yes |
| `show tree` shows only matching subtasks, with dimmed parents | Both | #3449, #3417 | yes: draft invited |
| Subtask progress bar, `hide progress`, middle layers, in a Display group | Both | #3319, PR #4048 | yes, after a feature request |
| `sort by readiness` | Both | #2655, #1162, #698 | yes, after a feature request |
| Property style: icons in results, Reading mode, dialog, auto-suggest, Quick Search, menus and settings | Both | #1737, discussion #1965 | yes, last |
| "Reset custom status types" shown in red | Both | #2353, #2358 | yes, small |
| Dragging in "Hide and reorder fields" styled like Obsidian's lists | Both | #1334, PR #4133 | yes, small |
| Toggle every task in a multi-line selection | Personal | discussion #1160, #3879, PR #4123 | **yes**: cut a branch |
| Reject a status symbol that another status already uses | Personal | #2357 (nearby) | **yes**: small fix |
| Confirm before resetting custom statuses | Personal | #2353, #2358 | yes, together with the red reset |
| Confirm before deleting a preset | Personal | none | maybe, together with the reset confirmation |
| Drag to reorder custom statuses | Personal | #2026 (not planned), #3483 | maybe; small |
| Require a query when adding or editing a preset | Personal | none | maybe; needs a bug report |
| "Blocked by"/"Blocks" dependency labels | Personal | #3605 (labels misread) | maybe; after #4135 and #4145 |
| Task properties shown compactly in Live Preview | Personal | PR #4048 (FR invited), discussion #1965 | later, after icons |
| Click a date in Live Preview to pick it | Personal | #3818, PR #4135 | later, after #4135 |
| Postpone button next to the date it postpones | Personal | #3007 (not planned), #3818 | unlikely |
| Native date input instead of flatpickr | Personal | #4134, PR #4135 (another contributor) | no; keep upstream's once merged |
| Status page look: symbol, type and "Next →" chips, Tools list | Personal | #3483 | no; your design |
| Edit dialog: options button beside close, alignment, priority order, wording | Personal | PR #4133, PR #4145 | no; your taste |
| Reorder and reword the status edit dialog | Personal | none | no; your taste |
| Settings wording polish | Personal | PR #4071 already refined it | no |
| "Toggle task done" renamed "Toggle task statuses" | Personal | PR #4048: renaming breaks command palette search | no |
| Clearer notices, tooltips and menu labels | Personal | none | no, unless one at a time |
| Dataview suggestions only inside `[]`, not `()` | Personal | PR #2204: `()` is intended (Dataview's hidden fields) | no |
| No copy button in query results | Personal | PR #4048 ("I use this a lot"); #4073 | no; fix #4073 instead |
| The personal build itself (`personal/`) | Personal | | never |

## 4. Watch upstream

- **PR #4135** (native date pickers, by another contributor): when it merges, the next `git merge main` into `personal` will conflict with your own native date picker commit. Keep upstream's version.
- **PR #4145** (date order in the edit dialog): it edits the same dialog as `fix/edit-dialog-labels` and your edit-dialog tweaks. Expect conflicts when it merges.
- **Once an upstream PR of yours merges:** delete its branch locally and on the fork, and change its row above to "upstream":

  ```bash
  git branch -d <branch>
  git push origin --delete <branch>
  ```
