# Container Wrangler

See your Docker containers from the DankBar, without opening a terminal. Click the bar icon to open a popout listing every container, running or stopped, with its image and status.

**v1 is visibility only.** There are no start/stop/restart actions, logs, exec, or Compose view yet.

## Requirements

- [DankMaterialShell](https://github.com/AvengeMedia/DankMaterialShell)
- The `docker` CLI on your `PATH`, and permission to talk to the daemon (usually membership of the `docker` group)
- Optional: [`colima`](https://github.com/abiosoft/colima) on your `PATH`, if you use it

## Install

Add this registry, then install the plugin:

```bash
dms registry add dank-dms-plugins https://github.com/kennycrous/dank-dms-plugins.git
dms plugins install containerWrangler
```

Then enable **Container Wrangler** in Settings → Plugins and add it to DankBar.

## What it shows

Each container is a row with a status dot, its name, its image, and its status text (for example `Up 3 hours`):

- green dot: running
- amber dot: restarting
- dimmed row, grey dot: stopped, exited, created, paused or dead

Containers are sorted running first, then restarting, then stopped, alphabetically within each group. The popout grows with the list up to a maximum height, then scrolls. It refreshes every 5 seconds while open, and immediately when you open it.

If nothing is reachable it says so, instead of showing an empty list.

## How engines are detected

The plugin checks for container engines independently, in parallel, so one being missing, stopped or slow never hides another:

| Engine | Where its socket comes from |
| --- | --- |
| **Docker** | `DOCKER_HOST` if set, otherwise `unix:///var/run/docker.sock` |
| **Colima** | The `docker_socket` reported by `colima status --json` (default profile), only when Colima is running |

If both resolve to the same socket (for example `DOCKER_HOST` points at Colima's socket) it's listed once, as Colima. When more than one engine is connected, the list is split under a header per engine. With a single engine there are no headers.

Colima being absent or stopped isn't an error, it just means there's no Colima engine. `DOCKER_HOST` is passed to `docker -H` as-is, so `tcp://` and `ssh://` endpoints work however the docker CLI handles them.

## Not supported yet

- Named Colima profiles (the default profile only)
- Docker contexts other than the default
- Any container actions, logs or exec
- A running-container count on the bar icon (planned, see `.plans/container-wrangler-002-running-badge.md`)

## Development

Parsing and view-model logic lives in plain JavaScript under `lib/`, written to load both from QML and from Node, so it has real unit tests. Run them from this directory:

```bash
cd lib && node --test
```

The QML (widget and service) can't be unit tested without a running DMS, so it's checked by hand. To try the plugin from a checkout, symlink it into DMS's plugin directory and restart DMS:

```bash
ln -s "$PWD" ~/.config/DankMaterialShell/plugins/containerWrangler
dms restart
```

See [`.docs/DESIGN.md`](../../.docs/DESIGN.md) for how plugins in this repo are structured and tested.
