pragma Singleton

import QtQuick
import Quickshell
import qs.Common
import "./lib/colimaStatus.js" as ColimaStatus

Item {
    id: root

    readonly property string pluginId: "containerWrangler"

    // "unknown" | "running" | "not-running" | "not-installed" | "error"
    property string state: "unknown"
    property string runtime: ""
    property string dockerSocket: ""
    property string errorMessage: ""

    function refresh() {
        Proc.runCommand(`${pluginId}.status`, ["colima", "status", "--json"], (stdout, exitCode) => {
            const result = ColimaStatus.parseColimaStatus({ exitCode, stdout });
            root.state = result.state;
            root.runtime = result.runtime || "";
            root.dockerSocket = result.dockerSocket || "";
            root.errorMessage = result.message || "";
        });
    }

    Component.onCompleted: refresh()
}
