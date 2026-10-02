import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins

PluginComponent {
    id: root

    // Singletons are lazy-loaded in QML; without touching the service here
    // it wouldn't be created (and wouldn't start its first status check)
    // until the popout was first opened.
    Component.onCompleted: console.log(ContainerWranglerService.pluginId, "loaded.")

    // Real container data arrives in a later slice; for now every state
    // that isn't "connected" gets its own honest message, and "connected"
    // itself just confirms detection worked while the list is still TODO.
    function statusMessage() {
        switch (ContainerWranglerService.state) {
        case "connected":
            // Placeholder until the real list: one line per reachable engine.
            return ContainerWranglerService.engines
                .filter(e => e.state === "connected")
                .map(e => `${e.label}: ${e.containers.length} containers`)
                .join("\n");
        case "unreachable":
            return "Docker not reachable";
        case "error":
            return ContainerWranglerService.errorMessage || "Couldn't read container list";
        default:
            return "Checking Docker…";
        }
    }

    horizontalBarPill: Component {
        StyledRect {
            width: parent.widgetThickness
            height: parent.widgetThickness
            radius: Theme.cornerRadius
            color: "transparent"

            DankIcon {
                anchors.centerIn: parent
                name: "deployed_code"
                size: Theme.iconSize
                color: Theme.widgetIconColor || Theme.surfaceText
            }
        }
    }

    verticalBarPill: horizontalBarPill

    popoutContent: Component {
        PopoutComponent {
            headerText: "Container Wrangler"

            StyledText {
                width: parent.width
                text: root.statusMessage()
                color: ContainerWranglerService.state === "error" ? Theme.error : Theme.surfaceText
                font.pixelSize: Theme.fontSizeMedium
                wrapMode: Text.WordWrap
            }
        }
    }

    popoutWidth: 320
    popoutHeight: 120
}
