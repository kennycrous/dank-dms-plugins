import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins

PluginComponent {
    id: root

    // Real container data arrives in a later slice; for now every state
    // that isn't "running" gets its own honest message, and "running"
    // itself just confirms detection worked while the list is still TODO.
    function statusMessage() {
        switch (ContainerWranglerService.state) {
        case "running":
            return "Colima is running — container list coming soon";
        case "not-running":
            return "Colima is not running";
        case "not-installed":
            return "Colima is not installed";
        case "error":
            return ContainerWranglerService.errorMessage || "Couldn't check Colima status";
        default:
            return "Checking Colima status…";
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
