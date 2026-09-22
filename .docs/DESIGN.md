# Design

Notes on how this registry is structured and why, and conventions for plugins built for it.

## Registry structure

- `plugins/` — one JSON file per plugin, per the schema in [CONTRIBUTING.md](../CONTRIBUTING.md).
- `.plans/` — one planning doc per plugin/story, from idea to submission.
- `.docs/` — this folder; cross-cutting docs that aren't tied to a single plugin.

## Working conventions

- **Atomic commits.** Plan work lands as one commit per step, not one bundled commit for the whole plan.
- **Shift-left testing / TDD.** Write the failing test for a step before the code that makes it pass; tests land in the same commit as the code they cover, not a later cleanup step.
