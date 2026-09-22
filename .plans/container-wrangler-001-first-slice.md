# Container Wrangler — First Slice

**Status:** in-progress

## Summary

Container status/management plugin, inspired by [LuckShiba/DmsDockerManager#6](https://github.com/LuckShiba/DmsDockerManager/pull/6) (an unmerged PR on the existing "Docker Manager" plugin adding Colima support). Not a fork or a lift-and-shift of that plugin's feature set — built fresh, scoped feature by feature, with Colima as a first-class target from the start rather than a runtime bolted onto a Docker-first design.

Core motivation: quick container actions from the bar, without opening a terminal. That's the north star for later slices — **v1 itself is visibility only, no actions.**

### v1 (thin slice) scope

- Detects whether the Colima VM (default profile) is running
- Colima not running → popout shows a clear "Colima not running" state (no start button yet)
- Colima running → popout lists containers running inside it: name, status, image
- Auto-refreshes on a timer while the popout is open
- No bar-badge count (icon only)
- No start/stop/restart/pause, no logs/exec, no Compose view
- Docker-native (non-Colima) support and named Colima profiles are out of scope for v1

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
    "description": "Colima container visibility for DankBar",
    "dependencies": ["colima"],
    "compositors": ["any"],
    "distro": ["any"],
    "screenshot": ""
}
```

Monorepo plugin — `repo` points at this registry repo itself, `path` at `plugins-src/containerWrangler`, per [.docs/DESIGN.md](../.docs/DESIGN.md).

## Testing

Follow shift-left testing / TDD: write the failing test for a step before writing the code that makes it pass. Each commit below should include its own tests, not defer them to a later step.

- Colima status parsing and container-list parsing (whatever shells out to `colima status` / the docker CLI against the Colima socket) are pure logic — cover with unit tests against captured sample output (running, not-running, empty list, multiple containers).
- UI states (empty/not-running, populated list) are verified manually in DMS for v1; no QML test harness assumed yet.

## Commits

Break the work into atomic commits, one per step, tests included. Check off as each lands:

- [x] `plugin.json` scaffold + minimal static-icon `ContainerWranglerWidget.qml` for `containerWrangler` in `plugins-src/` (no Colima logic, no popout yet). `qmldir` deferred — [DMS's documented plugin structure](https://github.com/AvengeMedia/DankMaterialShell/blob/master/quickshell/PLUGINS/README.md) doesn't require one, and there's no singleton service yet to register; adding it alongside `ContainerWranglerService.qml` in the next commit instead of as an empty placeholder now.
- [x] Colima status detection (parses `colima status` output) + unit tests for running/not-running/not-installed cases. Uses `colima status --json` (structured, not log scraping); "not-installed" is inferred from Proc's timeout exit code 124, not a real colima error — see comment in `lib/colimaStatus.js`.
- [ ] "Colima not running" empty state in the popout
- [ ] Container listing (parses container name/status/image from the Colima-backed docker socket) + unit tests for empty/populated output
- [ ] Popout list UI rendering parsed containers
- [ ] Auto-refresh timer while popout is open
- [ ] Registry entry: `plugins/kennycrous-container-wrangler.json`
- [ ] Plugin README (`plugins-src/containerWrangler/README.md`) documenting v1 scope and requirements

## Open questions / TODOs

- Exact mechanism for pointing the docker CLI at Colima's socket (env var export vs `docker context`) — resolve at implementation time, PR #6's `DockerService.qml` is a reference for the socket-path logic, not something to copy wholesale
- Auto-refresh interval — TBD at implementation time
- Screenshot — needs a real one once v1 UI exists
- Backlog (post-v1, not yet scoped): bar-badge running count, start/stop/restart actions, Docker-native support, named Colima profiles, logs/exec, Compose view — pull into their own `.plans/` entries or `.docs/FUTURE_FEATURES.md` as they're prioritized, not into this plan
