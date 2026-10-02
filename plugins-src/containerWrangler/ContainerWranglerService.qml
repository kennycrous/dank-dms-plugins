pragma Singleton

import QtQuick
import Quickshell
import qs.Common
import "./lib/colimaStatus.js" as ColimaStatus
import "./lib/containerList.js" as ContainerList

Item {
    id: root

    readonly property string pluginId: "containerWrangler"

    // "unknown" | "running" | "not-running" | "not-installed" | "error"
    property string state: "unknown"
    property string runtime: ""
    property string dockerSocket: ""
    property string errorMessage: ""
    // [{ id, name, image, state, status }], populated while state === "running"
    property var containers: []

    function refresh() {
        Proc.runCommand(`${pluginId}.status`, ["colima", "status", "--json"], (stdout, exitCode) => {
            const result = ColimaStatus.parseColimaStatus({ exitCode, stdout });
            root.state = result.state;
            root.runtime = result.runtime || "";
            root.dockerSocket = result.dockerSocket || "";
            root.errorMessage = result.message || "";
            if (result.state === "running") {
                root.refreshContainers();
            } else {
                root.containers = [];
            }
        });
    }

    // Points docker at Colima's socket explicitly via -H (the path comes from
    // `colima status --json`), so no env var export or `docker context` switch.
    function refreshContainers() {
        Proc.runCommand(`${pluginId}.containers`, ["docker", "-H", root.dockerSocket, "ps", "--format", "{{json .}}"], (stdout, exitCode) => {
            const result = ContainerList.parseContainerList({ exitCode, stdout });
            if (result.ok) {
                root.containers = result.containers;
            } else {
                root.containers = [];
                root.state = "error";
                root.errorMessage = result.message;
            }
        });
    }

    Component.onCompleted: refresh()
}
