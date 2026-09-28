# Personal build

This folder exists only on the `personal` branch. It installs the plugin into a vault as a separate plugin, **Tasks (Personal)**, with its own id (`obsidian-tasks-personal`, set in `identity.json`), in `.obsidian/plugins/obsidian-tasks-personal`. Obsidian never offers to update it from the official plugin.

## Branches

| Branch | Contents | Pushed to |
| --- | --- | --- |
| `main` | An exact copy of `upstream/main`. Never commit here. | `origin` |
| `feat/...`, `fix/...` | One change for the official plugin, branched from `main`. | `origin`, then a PR to `upstream` |
| `personal` | `main`, plus merged feature branches, plus personal-only commits. | `origin` |

Remotes: `upstream` is `obsidian-tasks-group/obsidian-tasks`, and `origin` is your fork.

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
git switch personal && git merge main
```

## Add a feature

- **For the official plugin too:** branch from `main`, commit, and merge the branch into `personal` to use it now. Open a PR from the branch. Only rewrite the branch before merging it into `personal`.
- **Only for yourself:** commit directly on `personal`.
- **After a feature branch changes** (for example during review): `git switch personal && git merge <branch>`.

Keep personal-only files in this folder where possible, so merges from `main` do not conflict.

Never rebase `personal`: it is built from merges, and a rebase would copy the upstream and feature-branch commits it contains. Update it with `git merge` only.
