# Container Wrangler — First Slice

**Status:** in-progress

## Summary

Container status/management plugin for Docker. Inspired by [LuckShiba/DmsDockerManager#6](https://github.com/LuckShiba/DmsDockerManager/pull/6) (an unmerged PR on the existing "Docker Manager" plugin adding Colima support). Not a fork or a lift-and-shift of that plugin's feature set — built fresh, scoped feature by feature.

**Scope change 1 (after the first 4 commits):** v1 was originally Colima-only. The dev machine runs a native Docker daemon (`/var/run/docker.sock`, no Colima), so a Colima-only v1 couldn't be tested there; Colima is only available on the author's laptop. The plugin is now runtime-neutral: it resolves a docker socket, and Colima is one (optional) way to get one. The container parser and `docker -H <socket> ps` call were already runtime-agnostic, so the earlier commits carry over.

**Scope change 2 (Colima dropped):** Colima exists to give macOS (and Windows) a Docker daemon without Docker Desktop. DMS is Linux-only, where Docker Engine runs natively, so Colima is very unlikely to be what a DMS user runs, and it can't be exercised on the dev machine either. v1 is Docker-only. The Colima detection built in the first slice commits is removed (see the last step below); the earlier checked steps are left as history and describe what was true at the time. The per-engine plumbing (`engines`, `summarizeEngines`, section headers) stays for now as a seam for other Docker-API-compatible runtimes, but only a single Docker engine is detected.

Core motivation: quick container actions from the bar, without opening a terminal. That's the north star for later slices — **v1 itself is visibility only, no actions.**

### v1 (thin slice) scope

- Queries Docker at `DOCKER_HOST` if set, else `/var/run/docker.sock`
- Docker not reachable → popout shows a clear "Docker not reachable" state (no start button yet)
- Popout lists containers, running and stopped (`docker ps -a`): name, status, image
- Auto-refreshes on a timer while the popout is open
- No bar-badge count (icon only)
- No start/stop/restart/pause, no logs/exec, no Compose view
- Colima, Podman and other runtimes are out of scope; Docker contexts are ignored (the socket comes from `DOCKER_HOST` or the default path)

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
    "description": "Docker container visibility for DankBar",
    "dependencies": [],
    "compositors": ["any"],
    "distro": ["any"],
    "screenshot": ""
}
```

Monorepo plugin — `repo` points at this registry repo itself, `path` at `plugins-src/containerWrangler`, per [.docs/DESIGN.md](../.docs/DESIGN.md).

## Testing

Follow shift-left testing / TDD: write the failing test for a step before writing the code that makes it pass. Each commit below should include its own tests, not defer them to a later step.

- Socket resolution and container-list parsing (whatever shells out to the docker CLI) are pure logic — cover with unit tests against sample output (empty list, multiple containers, `DOCKER_HOST` set/unset/whitespace, the overall-state summary).
- UI states (empty/not-running, populated list) are verified manually in DMS for v1; no QML test harness assumed yet.

## Commits

Break the work into atomic commits, one per step, tests included. Check off as each lands:

- [x] `plugin.json` scaffold + minimal static-icon `ContainerWranglerWidget.qml` for `containerWrangler` in `plugins-src/` (no Colima logic, no popout yet). `qmldir` deferred — [DMS's documented plugin structure](https://github.com/AvengeMedia/DankMaterialShell/blob/master/quickshell/PLUGINS/README.md) doesn't require one, and there's no singleton service yet to register; adding it alongside `ContainerWranglerService.qml` in the next commit instead of as an empty placeholder now.
- [x] Colima status detection (parses `colima status` output) + unit tests for running/not-running/not-installed cases. Uses `colima status --json` (structured, not log scraping); "not-installed" is inferred from Proc's timeout exit code 124, not a real colima error — see comment in `lib/colimaStatus.js`.
- [x] "Colima not running" empty state (to be replaced by "Docker not reachable" in the socket-resolution step) in the popout. Widget now shows a state-specific message for all of `ContainerWranglerService.state`'s values (not just not-running) — free given the service already exposes them; "running" gets a placeholder until the real list lands.
- [x] Container listing (parses container name/status/image from the Colima-backed docker socket) + unit tests for empty/populated output. Socket question resolved: `docker -H <docker_socket> ps --format '{{json .}}'`, with the socket path taken from `colima status --json` — no env export or `docker context`. Service exposes `containers`; rendering is the next step.
- [x] Docker socket resolution + tests (`lib/dockerSocket.js`): pure `resolveDockerSocket` taking Colima's status result, `DOCKER_HOST` and the default path (Colima socket → `DOCKER_HOST` → `/var/run/docker.sock`). Service uses it instead of requiring Colima to be running; a missing `colima` binary falls through to the next candidate instead of being a terminal state. Service states are now `unknown | connected | unreachable | error` (nonzero `docker ps` exit → `unreachable`, malformed output → `error`). `DOCKER_HOST` is passed straight to `-H` unparsed, tcp/ssh included.
- [x] Independent engine detection + tests (`lib/dockerEngines.js`, replaces `dockerSocket.js`): pure `resolveEngines` (Docker + Colima, deduped by socket, usable before the Colima probe has returned) and `summarizeEngines` (overall state: any connected → connected, else any unknown → unknown, else error, else unreachable). Service probes each engine's `docker ps` in parallel and stores results per engine in `engines`; the overall `state` is derived from them. Motivated by the single-socket design letting one unavailable engine hide the others.
- [x] Update `plugin.json` description to match the runtime-neutral scope (the draft schema above is already updated)
- [x] Include stopped containers: `buildPsCommand` (tested) passes `-a`; entries carry `state`/`status` so the list UI can distinguish them.
- [x] Popout list UI rendering parsed containers. Row model is pure and tested (`lib/containerRows.js`: sort running → restarting → stopped then by name; engine headers only when more than one engine is connected); the QML is verified manually only. Rows show a status dot, name, image and status text, with stopped containers dimmed; the popout sizes to content up to 480px then scrolls, and has empty/unreachable/error states.
- [x] Auto-refresh timer while popout is open: a 5s `Timer` in the popout content, gated on `parentPopout.shouldBeVisible` (content stays loaded after close, so instantiation isn't a reliable "open" signal) and refreshing immediately on open. Verified manually only.
- [x] Registry entry: `plugins/kennycrous-container-wrangler.json` (`id`/`name`/`description` verified against `plugin.json`). `screenshot` points at the `main`-branch raw URL for `plugins-src/containerWrangler/screenshot.png`; it resolves once the branch is merged.
- [x] Plugin README (`plugins-src/containerWrangler/README.md`) documenting v1 scope and requirements
- [x] Drop Colima: remove `lib/colimaStatus.js` and its tests, the `colima` probe and `_colima` state in the service, the Colima engine and socket dedupe in `resolveEngines` (now just `{ dockerHost }`, tests updated first), and Colima from the README, widget hint text, `plugin.json` and registry descriptions

## Open questions / TODOs

- Screenshot: `plugins-src/containerWrangler/screenshot.png`, taken from the live popout with generic container names. The registry entry points at its `main`-branch raw URL, which 404s until this branch is merged
- Whether to collapse the now single-engine plumbing (`engines` array, `summarizeEngines`, section headers) into one Docker connection, or keep it as the seam for other runtimes
- Bar-badge running count is planned in [container-wrangler-002-running-badge.md](container-wrangler-002-running-badge.md)
- Backlog (post-v1, not yet scoped): start/stop/restart actions, logs/exec, Compose view — pull into their own `.plans/` entries or `.docs/FUTURE_FEATURES.md` as they're prioritized, not into this plan
