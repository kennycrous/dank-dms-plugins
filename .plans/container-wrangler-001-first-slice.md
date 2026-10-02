# Container Wrangler — First Slice

**Status:** in-progress

## Summary

Container status/management plugin for Docker, with first-class Colima support. Inspired by [LuckShiba/DmsDockerManager#6](https://github.com/LuckShiba/DmsDockerManager/pull/6) (an unmerged PR on the existing "Docker Manager" plugin adding Colima support). Not a fork or a lift-and-shift of that plugin's feature set — built fresh, scoped feature by feature.

**Scope change (after the first 4 commits):** v1 was originally Colima-only. The dev machine runs a native Docker daemon (`/var/run/docker.sock`, no Colima), so a Colima-only v1 couldn't be tested there; Colima is only available on the author's laptop. The plugin is now runtime-neutral: it resolves a docker socket, and Colima is one (optional) way to get one. The container parser and `docker -H <socket> ps` call were already runtime-agnostic, so the earlier commits carry over.

Core motivation: quick container actions from the bar, without opening a terminal. That's the north star for later slices — **v1 itself is visibility only, no actions.**

### v1 (thin slice) scope

- Resolves which docker socket to query, in order: Colima's `docker_socket` (if `colima status --json` succeeds for the default profile), then `DOCKER_HOST`, then `/var/run/docker.sock`
- No reachable socket → popout shows a clear "Docker not reachable" state (no start button yet)
- Socket reachable → popout lists containers: name, status, image
- Auto-refreshes on a timer while the popout is open
- No bar-badge count (icon only)
- No start/stop/restart/pause, no logs/exec, no Compose view
- Named Colima profiles are out of scope for v1 (default profile only)
- Docker contexts other than the default are out of scope

## Draft schema

```json
{
    "id": "containerWrangler",
    "name": "Container Wrangler",
    "capabilities": ["dankbar-widget"],
    "category": "utilities",
    "repo": "https://github.com/kennycrous/dank-dms-plugins",
    "path": "plugins-src/containerWrangler",
    "author": "kennycrous",
    "description": "Docker container visibility for DankBar, with Colima support",
    "dependencies": [],
    "compositors": ["any"],
    "distro": ["any"],
    "screenshot": ""
}
```

Monorepo plugin — `repo` points at this registry repo itself, `path` at `plugins-src/containerWrangler`, per [.docs/DESIGN.md](../.docs/DESIGN.md).

## Testing

Follow shift-left testing / TDD: write the failing test for a step before writing the code that makes it pass. Each commit below should include its own tests, not defer them to a later step.

- Colima status parsing, socket resolution and container-list parsing (whatever shells out to `colima status` / the docker CLI) are pure logic — cover with unit tests against captured sample output (running, not-running, empty list, multiple containers, each socket-resolution fallback).
- UI states (empty/not-running, populated list) are verified manually in DMS for v1; no QML test harness assumed yet.

## Commits

Break the work into atomic commits, one per step, tests included. Check off as each lands:

- [x] `plugin.json` scaffold + minimal static-icon `ContainerWranglerWidget.qml` for `containerWrangler` in `plugins-src/` (no Colima logic, no popout yet). `qmldir` deferred — [DMS's documented plugin structure](https://github.com/AvengeMedia/DankMaterialShell/blob/master/quickshell/PLUGINS/README.md) doesn't require one, and there's no singleton service yet to register; adding it alongside `ContainerWranglerService.qml` in the next commit instead of as an empty placeholder now.
- [x] Colima status detection (parses `colima status` output) + unit tests for running/not-running/not-installed cases. Uses `colima status --json` (structured, not log scraping); "not-installed" is inferred from Proc's timeout exit code 124, not a real colima error — see comment in `lib/colimaStatus.js`.
- [x] "Colima not running" empty state (to be replaced by "Docker not reachable" in the socket-resolution step) in the popout. Widget now shows a state-specific message for all of `ContainerWranglerService.state`'s values (not just not-running) — free given the service already exposes them; "running" gets a placeholder until the real list lands.
- [x] Container listing (parses container name/status/image from the Colima-backed docker socket) + unit tests for empty/populated output. Socket question resolved: `docker -H <docker_socket> ps --format '{{json .}}'`, with the socket path taken from `colima status --json` — no env export or `docker context`. Service exposes `containers`; rendering is the next step.
- [x] Docker socket resolution + tests (`lib/dockerSocket.js`): pure `resolveDockerSocket` taking Colima's status result, `DOCKER_HOST` and the default path (Colima socket → `DOCKER_HOST` → `/var/run/docker.sock`). Service uses it instead of requiring Colima to be running; a missing `colima` binary falls through to the next candidate instead of being a terminal state. Service states are now `unknown | connected | unreachable | error` (nonzero `docker ps` exit → `unreachable`, malformed output → `error`). `DOCKER_HOST` is passed straight to `-H` unparsed, tcp/ssh included.
- [ ] Update `plugin.json` description to match the runtime-neutral scope (the draft schema above is already updated)
- [ ] Popout list UI rendering parsed containers
- [ ] Auto-refresh timer while popout is open
- [ ] Registry entry: `plugins/kennycrous-container-wrangler.json`
- [ ] Plugin README (`plugins-src/containerWrangler/README.md`) documenting v1 scope and requirements

## Open questions / TODOs

- Show stopped/restarting containers too (`docker ps -a`)? Plain `docker ps` hides them, and the dev machine's only containers are `exited`/`restarting`. The parser already captures `state`, so this is mostly a UI/ordering decision — decide when the list UI lands
- The missing-`colima` case currently costs a 10s Proc timeout before falling through (see `lib/colimaStatus.js`); check whether a faster probe is worth it once the fallback exists
- Auto-refresh interval — TBD at implementation time
- Screenshot — needs a real one once v1 UI exists
- Backlog (post-v1, not yet scoped): bar-badge running count, start/stop/restart actions, named Colima profiles, logs/exec, Compose view — pull into their own `.plans/` entries or `.docs/FUTURE_FEATURES.md` as they're prioritized, not into this plan
