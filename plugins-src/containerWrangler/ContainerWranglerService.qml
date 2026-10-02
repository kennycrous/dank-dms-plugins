pragma Singleton

import QtQuick
import Quickshell
import qs.Common
import "./lib/colimaStatus.js" as ColimaStatus
import "./lib/containerList.js" as ContainerList
import "./lib/dockerSocket.js" as DockerSocket

Item {
    id: root

    readonly property string pluginId: "containerWrangler"

    // "unknown" | "connected" | "unreachable" | "error"
    property string state: "unknown"
    // Where dockerSocket came from: "colima" | "env" | "default"
    property string socketSource: ""
    property string dockerSocket: ""
    property string errorMessage: ""
    // [{ id, name, image, state, status }], populated while state === "connected"
    property var containers: []

    // Colima is only consulted to learn its socket path; a stopped or missing
    // colima just means falling through to DOCKER_HOST / the default socket.
    function refresh() {
        Proc.runCommand(`${pluginId}.status`, ["colima", "status", "--json"], (stdout, exitCode) => {
            const colima = ColimaStatus.parseColimaStatus({ exitCode, stdout });
            const resolved = DockerSocket.resolveDockerSocket({
                colima,
                dockerHost: Quickshell.env("DOCKER_HOST") || ""
            });
            root.dockerSocket = resolved.socket;
            root.socketSource = resolved.source;
            root.refreshContainers();
        });
    }

    // Points docker at the resolved socket explicitly via -H, so no env var
    // export or `docker context` switch.
    function refreshContainers() {
        Proc.runCommand(`${pluginId}.containers`, ["docker", "-H", root.dockerSocket, "ps", "--format", "{{json .}}"], (stdout, exitCode) => {
            root.containers = [];
            // Nonzero covers a stopped daemon, a missing socket, permissions,
            // and (124) a missing docker binary — none distinguishable here.
            if (exitCode !== 0) {
                root.state = "unreachable";
                root.errorMessage = "";
                return;
            }
            const result = ContainerList.parseContainerList({ exitCode, stdout });
            if (result.ok) {
                root.state = "connected";
                root.errorMessage = "";
                root.containers = result.containers;
            } else {
                root.state = "error";
                root.errorMessage = result.message;
            }
        });
    }

    Component.onCompleted: refresh()
}
