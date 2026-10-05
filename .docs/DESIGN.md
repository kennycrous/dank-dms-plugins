# Design

Notes on how this registry is structured and why, and conventions for plugins built for it.

## Registry structure

- `plugins/` — one JSON file per plugin (registry metadata), per the schema in [CONTRIBUTING.md](../CONTRIBUTING.md).
- `plugins-src/` — this is a monorepo: plugin source code lives here, one folder per plugin (see below).
- `.plans/` — planning docs. A feature accumulates one file per slice as it's iterated on, named `<feature-slug>-<NNN>-<slice-slug>.md` (e.g. `container-wrangler-001-first-slice.md`) — kebab-case, 3-digit zero-padded sequence number per feature, short slug for what that slice covers.
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

## Testing plugin logic

Plugin QML can't be unit tested without a running DMS/Quickshell instance, so pure logic (parsing, formatting, anything that doesn't touch Qt/QML APIs) lives in plain `.js` files under each plugin's `lib/`, written to load both ways:

- From QML, via `import "./lib/<name>.js" as X` (QML's script-file loading — no bundler, no `module` global).
- From Node, via `require("./<name>.js")`, for the actual unit tests.

A file supporting both ends with a guarded export:

```js
if (typeof module !== "undefined" && module.exports) {
    module.exports = { someFunction };
}
```

Run all plugin unit tests with:

```bash
node --test plugins-src
```

No test framework dependency — Node's built-in `node:test` + `node:assert` is enough for pure-function tests. QML-side wiring (the singleton service that actually shells out, the widget UI) is verified manually in DMS; see `container-wrangler-001-first-slice.md` for an example of this split.
