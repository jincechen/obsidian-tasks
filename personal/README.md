# Personal build

This folder exists only on the `personal` branch. It installs the plugin into a vault as a separate plugin, **Tasks (Personal)**, with its own id (`obsidian-tasks-personal`, set in `identity.json`), in `.obsidian/plugins/obsidian-tasks-personal`. Obsidian never offers to update it from the official plugin.

What to do next: [NEXT-STEPS.md](NEXT-STEPS.md). Drafts of issues and PR texts for upstream: [upstream/](upstream/).

## Branches

| Branch | Contents | Lifetime |
| --- | --- | --- |
| `main` | An exact copy of `upstream/main`. Never commit here. | permanent |
| `personal` | `main`, plus merged upstream-bound branches, plus personal-only commits. | permanent |
| `feat/...`, `fix/...`, `test/...` | One change headed for the official plugin, branched from `main`. | deleted once merged upstream or abandoned |

Personal-only changes (the status settings page design, native date picker, Live Preview properties, edit dialog layout, wording, and so on) are commits directly on `personal`, not branches.

Remotes: `upstream` is `obsidian-tasks-group/obsidian-tasks`, and `origin` is your fork.

Backups: before the rebuild on 2026-11-21, every branch was tagged `archive/2026-11-21/<branch>` and pushed to `origin`. To restore one: `git switch -c <name> archive/2026-11-21/<branch>`.

## Install into a vault

```bash
node personal/deploy.mjs "path/to/vault"
```

To skip the path, put it on the first line of `personal/vault.local` (not committed). Add `--no-build` to deploy the last build.

The first install into a vault copies the official plugin's settings and hotkeys. Then, in Obsidian:

1. Disable the official **Tasks** plugin. Both cannot run at once.
2. Enable **Tasks (Personal)** in **Settings → Community plugins**.

Other plugins that use the Tasks API look for the official plugin id, so they will not find this one.

## Get new features from the official plugin

```bash
git fetch upstream
git switch main && git merge --ff-only upstream/main && git push origin main
yarn install   # if package.json changed
git switch personal && git merge main
```

Then run `yarn build`, `yarn lint` and `yarn test`. Use the Node version upstream's CI uses (22.x, currently 22.23.5): `winget upgrade --id OpenJS.NodeJS.22`.

## Add a feature

- **For the official plugin too:** branch from `main`, commit, and merge the branch into `personal` (`git merge --no-ff <branch>`) to use it now. Rewrite the branch only before it is merged into `personal` or opened as a PR.
- **Only for yourself:** commit directly on `personal`. Since 2026-11-21, new changes go on a branch from `main` by default, so that both versions get them.
- **After a feature branch changes** (for example during review): `git switch personal && git merge <branch>`.

Never rebase `personal`: it is built from merges, and a rebase would copy the upstream and feature-branch commits it contains. Update it with `git merge` only.

## Upstream rules, in short

The full guide is at <https://publish.obsidian.md/tasks-contributing/>.

- **Issue first:** have an issue or discussion that a maintainer agreed to before any `feat` or `fix` PR.
- **One thing per PR:** one fix, feature or refactor.
- **Commits:** a prefix from the PR template (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `i18n:`, `vault:`, `contrib:`) and a subject of at most 72 characters. Add a concise detail line only if necessary. Never add trailers such as `Co-Authored-By`. Every commit builds and passes the tests.
- **Bug fixes:** a `test:` commit with `it.fails(...)` (Vitest), then a `fix:` commit that changes it to `it(...)`, then `docs:` if needed.
- **Docs:** new features get `> [!released]` / `> Introduced in Tasks X.Y.Z.` Never edit the Changelog.
- **Once a PR is open:** never rebase or force-push its branch, and never skip the lefthook hooks.
- **Before opening:** you, not an AI, review and understand the change, and test the built plugin in a vault. The PR template asks you to confirm this.
