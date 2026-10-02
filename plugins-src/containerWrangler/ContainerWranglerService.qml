pragma Singleton

import QtQuick
import Quickshell
import qs.Common
import "./lib/colimaStatus.js" as ColimaStatus
import "./lib/containerList.js" as ContainerList
import "./lib/dockerEngines.js" as EngineDetect

Item {
    id: root

    readonly property string pluginId: "containerWrangler"

    // Overall state across engines: "unknown" | "connected" | "unreachable" | "error"
    property string state: "unknown"
    property string errorMessage: ""
    // One entry per detected engine, each probed independently so one being
    // missing, stopped or slow never hides another:
    // { id, label, socket, state, errorMessage, containers: [{ id, name, image, state, status }] }
    property var engines: []

    // Last parsed `colima status` result; null until the probe first returns.
    property var _colima: null

    function refresh() {
        // Docker doesn't wait on colima: resolving with the last known colima
        // result (null on the first pass) starts its probe immediately.
        // _syncEngines probes engines it adds itself, so only re-probe the
        // ones that were already there.
        const before = root.engines;
        root._syncEngines(root._colima);
        for (const e of root.engines) {
            if (before.includes(e)) {
                root._probeEngine(e);
            }
        }

        // The `command -v` guard is deliberate: Quickshell never reports exit
        // for a binary that fails to start, so running a missing `colima`
        // directly would sit out Proc's 10s timeout. With the guard it exits 1
        // at once. Colima is only consulted to discover its socket.
        const probe = "command -v colima >/dev/null 2>&1 && exec colima status --json";
        Proc.runCommand(`${pluginId}.status`, ["sh", "-c", probe], (stdout, exitCode) => {
            root._colima = ColimaStatus.parseColimaStatus({ exitCode, stdout });
            root._syncEngines(root._colima);
        });
    }

    // Reconciles `engines` with what's currently detectable. New engines start
    // out "unknown" and are probed; one that merely changed id for the same
    // socket (docker's socket turning out to be colima's) inherits the old
    // result instead of re-probing.
    function _syncEngines(colima) {
        const wanted = EngineDetect.resolveEngines({
            colima,
            dockerHost: Quickshell.env("DOCKER_HOST") || ""
        });
        const next = wanted.map(w => {
            const same = root.engines.find(e => e.id === w.id && e.socket === w.socket);
            if (same) {
                return same;
            }
            const moved = root.engines.find(e => e.socket === w.socket);
            return Object.assign({ state: "unknown", errorMessage: "", containers: [] }, moved || {}, w);
        });
        const fresh = next.filter(n => !root.engines.includes(n) && n.state === "unknown");
        root.engines = next;
        root._updateSummary();
        for (const e of fresh) {
            root._probeEngine(e);
        }
    }

    // Points docker at the engine's socket explicitly via -H, so no env var
    // export or `docker context` switch.
    function _probeEngine(engine) {
        Proc.runCommand(`${pluginId}.containers.${engine.id}`, ContainerList.buildPsCommand(engine.socket), (stdout, exitCode) => {
            // Nonzero covers a stopped daemon, a missing socket, permissions,
            // and (124) a missing docker binary — none distinguishable here.
            if (exitCode !== 0) {
                root._setEngine(engine, { state: "unreachable", errorMessage: "", containers: [] });
                return;
            }
            const result = ContainerList.parseContainerList({ exitCode, stdout });
            if (result.ok) {
                root._setEngine(engine, { state: "connected", errorMessage: "", containers: result.containers });
            } else {
                root._setEngine(engine, { state: "error", errorMessage: result.message, containers: [] });
            }
        });
    }

    // Results arrive asynchronously, so look the engine up by id and socket
    // again; it may have been replaced by a newer sync in the meantime.
    function _setEngine(engine, patch) {
        root.engines = root.engines.map(e => (e.id === engine.id && e.socket === engine.socket) ? Object.assign({}, e, patch) : e);
        root._updateSummary();
    }

    function _updateSummary() {
        const summary = EngineDetect.summarizeEngines(root.engines);
        root.state = summary.state;
        root.errorMessage = summary.errorMessage;
    }

    Component.onCompleted: refresh()
}
