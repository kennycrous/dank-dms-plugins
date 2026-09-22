# Design

Notes on how this registry is structured and why, and conventions for plugins built for it.

## Registry structure

- `plugins/` — one JSON file per plugin (registry metadata), per the schema in [CONTRIBUTING.md](../CONTRIBUTING.md).
- `plugins-src/` — this is a monorepo: plugin source code lives here, one folder per plugin (see below).
- `.plans/` — one planning doc per plugin/story, from idea to submission.
- `.docs/` — this folder; cross-cutting docs that aren't tied to a single plugin.

## Monorepo: self-authored plugins

DMS's plugin installer (`Install()` in `core/internal/plugins/manager.go` upstream) supports registry entries whose `repo` points anywhere, including back at this same repo, with `path` set to a subfolder. When `path` is set, DMS clones the whole `repo` once and symlinks `<repo>/<path>` in as the installed plugin — it does not require a separate repo per plugin.

For plugins we author ourselves, source lives in `plugins-src/<plugin-id>/`:

```
plugins-src/<plugin-id>/
├── plugin.json      # plugin manifest — id/name must match plugins/<file>.json exactly
├── Widget.qml        # (or whatever components the plugin.json manifest points to)
└── ...
```

And the matching registry entry:

```json
{
    "id": "<plugin-id>",
    "repo": "https://github.com/kennycrous/dank-dms-plugins",
    "path": "plugins-src/<plugin-id>",
    "...": "..."
}
```

Third-party plugin submissions still point `repo` at the contributor's own repository, as usual.

## Working conventions

- **Atomic commits.** Plan work lands as one commit per step, not one bundled commit for the whole plan.
- **Shift-left testing / TDD.** Write the failing test for a step before the code that makes it pass; tests land in the same commit as the code they cover, not a later cleanup step.
