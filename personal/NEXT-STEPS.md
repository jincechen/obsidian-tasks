# Next steps

State on 2026-11-21:

- `main` matches upstream 8.6.0+ (9fecdd678).
- `personal` was rebuilt on top of `main`.
- 9 upstream-bound branches are ready.
- All of it is pushed to your fork.
- The old versions of every branch are kept as `archive/2026-11-21/*` tags.

## 1. Test your personal build (now)

```bash
node personal/deploy.mjs "path/to/vault"
```

The parts below have unit tests, but they have not been tried in Obsidian. Check them by hand:

- [ ] **Status settings page:** compare with your old screenshot. Check the filter, the "+" button, ×, dragging rows, the Tools list, and Reset (which now asks for confirmation).
- [ ] **Icons** (Settings → Display → Property style): results, Reading mode, the edit dialog, auto-suggest, Quick Search, menus.
- [ ] **Live Preview** compact properties, and clicking a date to pick one (native date picker).
- [ ] **Edit dialog:**
  - "Blocked by" and "Blocks" labels;
  - the options button beside the close button;
  - the field order, now set in upstream's **Hide and reorder fields**;
  - priority options listed Highest → Lowest (new; say if you don't want it).
- [ ] **Postpone button:** it sits after the date it postpones, which upstream's new **Postpone button** setting chooses.
- [ ] **Subtask progress bar** and its popup; `show tree` with only the matching subtasks; `sort by readiness`.
- [ ] **Toggle task statuses** (renamed from "Toggle task done"): try it on a multi-line selection; non-task lines are skipped.
- [ ] **Search box:** type quickly in a query's search box. Results must never show twice.

## 2. Contribute upstream, one small step at a time

The drafts are in [upstream/](upstream/). Before posting anything, check every step yourself in the **official** plugin. The PR template makes you confirm that you understand and have tested the change.

1. **PR 1, now:** `test/mock-data-loader-windows`. It's a `test:` PR, so no issue is needed. Text: [upstream/pr-descriptions.md](upstream/pr-descriptions.md).
2. **Two bug reports:** [bug-retry-notices.md](upstream/bug-retry-notices.md) and [bug-inferred-date-menu.md](upstream/bug-inferred-date-menu.md). Once a maintainer acknowledges each one, open **PR 2** (`fix/file-retry-notices`) and **PR 3** (`fix/inferred-scheduled-date-menu-item`).
3. **After those are handled:**
   - [comment-3449-show-tree.md](upstream/comment-3449-show-tree.md) on issue #3449, offering a draft PR of `feat/tree-matching-subtasks`;
   - the bug report [bug-results-shown-twice.md](upstream/bug-results-shown-twice.md). Record a video first.
4. **Feature requests, one or two at a time:**
   - [fr-subtask-progress.md](upstream/fr-subtask-progress.md) first;
   - then [fr-sort-by-readiness.md](upstream/fr-sort-by-readiness.md);
   - then [fr-property-icons.md](upstream/fr-property-icons.md);
   - the two accessibility bugs, [bug-edit-dialog-labels.md](upstream/bug-edit-dialog-labels.md) and [bug-result-buttons-keyboard.md](upstream/bug-result-buttons-keyboard.md), whenever there is a quiet moment.

   Open a PR only after a maintainer agrees.

To open a PR:

```bash
gh pr create --repo obsidian-tasks-group/obsidian-tasks --base main --head jincechen:<branch> --web
```

Use the template GitHub shows, keeping every section. Answer review comments within a week. Never rebase or force-push an open PR's branch. If a maintainer asks for changes, add commits, then run `git switch personal && git merge <branch>`.

## 3. Watch upstream

- **PR #4135** (native date pickers, by another contributor): when it merges, the next `git merge main` into `personal` will conflict with your own native date picker commit. Keep upstream's version.
- **Once an upstream PR of yours merges:** delete its branch locally and on the fork:

  ```bash
  git branch -d <branch>
  git push origin --delete <branch>
  ```

## Branches on the fork

Each branch is one change, with commits small enough to review one at a time (preparatory `refactor:` first, then `feat:` steps, then `docs:`; bug fixes as `test:` then `fix:`).

| Branch                                  | Commits | Upstream step                          |
| --------------------------------------- | ------- | -------------------------------------- |
| `test/mock-data-loader-windows`         | 1       | PR 1                                   |
| `fix/file-retry-notices`                | 2       | bug report → PR 2                      |
| `fix/inferred-scheduled-date-menu-item` | 2       | bug report → PR 3                      |
| `fix/query-results-shown-twice`         | 2       | bug report (video)                     |
| `fix/edit-dialog-labels`                | 2       | bug report, later                      |
| `fix/result-buttons-keyboard`           | 2       | bug report, later                      |
| `feat/tree-matching-subtasks`           | 4       | comment on #3449                       |
| `feat/subtask-progress`                 | 9       | feature request                        |
| `feat/sort-by-readiness`                | 3       | feature request                        |
| `feat/property-icons`                   | 12      | feature request (largest; split by area) |
