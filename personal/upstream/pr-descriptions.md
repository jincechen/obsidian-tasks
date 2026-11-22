# PR descriptions (ready to paste)

Open each PR from your fork's branch into `obsidian-tasks-group/obsidian-tasks:main`. **GitHub fills in the PR template.** Keep every section and its order, tick the boxes yourself, and paste the parts below into the matching sections. Only tick the "Terms" boxes once they are true: you have read and understood the change, and for `src/` changes you have tested the built plugin in a vault.

---

## PR 1: `test/mock-data-loader-windows`

**Title:** `test: Make MockDataLoader path test pass on Windows`
**Type:** Tests

**Description:** `MockDataLoader.path()` returns a path with the platform's separator, so on Windows the test compared `tests\Obsidian\…` with `tests/Obsidian/…` and failed. The test now builds the expected path with `path.join`.

**Motivation and Context:** On Windows, `yarn test` always fails this test. Because the lefthook hooks run the suite, contributors on Windows can't commit or push without working around it.

**How has this been tested?** On Windows 11, `yarn test` passes with this change and fails without it. The change only touches a test, so it doesn't affect Linux or macOS CI.

---

## PR 2: `fix/file-retry-notices` (only once the bug report is acknowledged)

**Title:** `fix: Stop showing a notice on every retry of a task edit`
**Type:** Bug fix. Issue: #<bug report number>

**Description:** When Tasks has to retry saving a task edit, for example while Obsidian is still indexing a file, it no longer shows a notice for every retry. Those messages now go to the developer console. If all retries fail, the existing notice still appears.

**Motivation and Context:** Fixes #<number>. Several "Retrying ..." notices could pop up even when the edit then succeeded.

**How has this been tested?** The first commit adds a test marked `it.fails`, which shows a notice is shown on retry. The fix commit makes it pass. I also tested the steps from the issue in my vault with the built plugin.

---

## PR 3: `fix/inferred-scheduled-date-menu-item` (only once the bug report is acknowledged)

**Title:** `fix: Disable the menu item for removing an inferred scheduled date`
**Type:** Bug fix. Issue: #<bug report number>

**Description:** In the scheduled date's right-click menu, "Cannot remove inferred scheduled date" is now shown disabled, instead of looking clickable and doing nothing.

**Motivation and Context:** Fixes #<number>.

**How has this been tested?** The first commit adds a test marked `it.fails`, and the fix commit makes it pass. I also checked by hand, with a task in a daily note and **Use filename as Scheduled date** turned on.
