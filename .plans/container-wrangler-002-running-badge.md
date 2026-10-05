# Container Wrangler — Running-Count Badge

**Status:** idea

## Summary

Show the number of running containers next to the bar icon, so container state is visible without opening the popout. Follow-up to [container-wrangler-001-first-slice.md](container-wrangler-001-first-slice.md), which deliberately shipped icon-only and polls only while the popout is open.

Depends on 001 being complete (service, per-engine state, `containerGroup` in `lib/containerRows.js`).

### Scope

- Bar pill shows a number beside the icon: running containers summed across all connected engines
- Restarting and stopped containers don't count; only `running`
- Badge hidden when the count is 0 or no engine is connected (a bare `0` is noise)
- Polling runs for as long as the widget is loaded, not just while the popout is open: slower when closed, faster when open
- No new actions, no per-engine breakdown in the bar, no notifications on change

## Draft schema

No manifest changes — same `plugin.json` and registry entry as 001.

## Testing

Follow shift-left testing / TDD: write the failing test for a step before writing the code that makes it pass. Each commit below should include its own tests, not defer them to a later step.

- Running count is pure logic — cover with unit tests: no engines, one engine, several engines, unreachable/unknown engines contribute nothing, restarting/stopped excluded.
- Refresh cadence selection (closed vs open interval) is small enough to extract and test if it grows any logic; the timer wiring and badge rendering are verified manually in DMS.

## Commits

Break the work into atomic commits, one per step, tests included. Check off as each lands:

- [ ] `countRunning(engines)` in `lib/` + unit tests
- [ ] Always-on refresh at the widget level. Per the open questions, the likely design is a `docker events` stream as the trigger (spike first) with the poll as a fallback; otherwise a slower closed interval plus the existing faster interval while the popout is open. Either way remove the popout-only timer. Confirm overlapping probes can't pile up if one runs long (Proc debounces by id, but verify with a slow/hung daemon)
- [ ] Badge in the horizontal and vertical bar pills, hidden at 0 / disconnected
- [ ] Update plugin README to mention the badge and that the widget now polls while the popout is closed

## Open questions / TODOs

- Closed-popout interval — 15s is the starting guess; tune against actual cost (one `docker ps -a` per tick)
- Pause polling when the screen is locked or the session is idle? DMS reclaims popout content on lock/idle (see `_contentWarm` in `DankPopoutStandalone.qml`); the service might want the same
- Badge styling in vertical bars, where horizontal space beside the icon is limited
- **Preferred approach (spike first): stream `docker events` instead of polling.** One long-lived `docker events --filter type=container --format '{{json .}}'` process, used only as a trigger: on a (debounced) start/stop/die/etc. event, re-run `docker ps -a` and rebuild state, rather than patching state from event payloads. Gives an instant badge and no idle polling. Details to settle:
  - Do one `docker ps -a` at startup and another every time the stream (re)connects, so changes made while it was down aren't missed
  - `Proc.runCommand` runs to completion; a stream needs Quickshell's `Process` with a line parser (`SplitParser`), plus restart with backoff when it exits. A missing `docker` binary surfaces as `onErrorOccurred`, not `exited`, so handle both
  - Event payloads don't carry the relative status text ("Up 3 hours"), so keep a slow re-list while the popout is open (or recompute it) for that text
  - Fall back to the closed-popout poll described above if streaming proves flaky
