pragma Singleton

import QtQuick
import Quickshell
import qs.Common
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

    function refresh() {
        root._syncEngines();
        for (const e of root.engines) {
            root._probeEngine(e);
        }
    }

    // Keeps existing engine entries (and their last results, so the popout
    // doesn't flicker between refreshes) and adds any newly resolved ones.
    function _syncEngines() {
        const wanted = EngineDetect.resolveEngines({ dockerHost: Quickshell.env("DOCKER_HOST") || "" });
        root.engines = wanted.map(w => root.engines.find(e => e.id === w.id && e.socket === w.socket)
            || Object.assign({ state: "unknown", errorMessage: "", containers: [] }, w));
        root._updateSummary();
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
