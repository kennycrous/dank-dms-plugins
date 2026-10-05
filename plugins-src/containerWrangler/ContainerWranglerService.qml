pragma Singleton

import QtQuick
import qs.Common
import "./lib/containerList.js" as ContainerList

Item {
    id: root

    readonly property string pluginId: "containerWrangler"

    // "unknown" | "connected" | "unreachable" | "error"
    property string state: "unknown"
    property string errorMessage: ""
    // [{ id, name, image, state, status }], populated while state === "connected"
    property var containers: []

    // The docker CLI resolves the endpoint itself (see buildPsCommand), so
    // this follows whatever `docker ps` would show in a terminal.
    function refresh() {
        Proc.runCommand(`${pluginId}.containers`, ContainerList.buildPsCommand(), (stdout, exitCode) => {
            // Nonzero covers a stopped daemon, a missing socket, permissions,
            // and (124) a missing docker binary — none distinguishable here.
            if (exitCode !== 0) {
                root.state = "unreachable";
                root.errorMessage = "";
                root.containers = [];
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
                root.containers = [];
            }
        });
    }

    Component.onCompleted: refresh()
}
