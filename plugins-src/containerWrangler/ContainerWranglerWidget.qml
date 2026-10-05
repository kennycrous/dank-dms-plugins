import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins
import "./lib/containerRows.js" as ContainerRows

PluginComponent {
    id: root

    // Singletons are lazy-loaded in QML; without touching the service here
    // it wouldn't be created (and wouldn't start its first status check)
    // until the popout was first opened.
    Component.onCompleted: console.log(ContainerWranglerService.pluginId, "loaded.")

    // Ordered rows for the popout list.
    readonly property var rows: ContainerRows.buildRows(ContainerWranglerService.containers)

    // Layout constants shared by the delegates and the popout height estimate
    // below, so the popout is sized to exactly what gets drawn.
    readonly property real rowHeight: 52
    readonly property real listSpacing: Theme.spacingS
    readonly property real popoutHeaderHeight: 40
    // Padding PluginPopout puts around the content; same allowance
    // dockerManager makes (Theme.spacingXL) so the last row isn't clipped.
    readonly property real popoutChromeHeight: Theme.spacingXL
    readonly property real maxPopoutHeight: 480
    readonly property real emptyPopoutHeight: 180
    readonly property int refreshIntervalMs: 5000

    readonly property real listContentHeight: rows.length * rowHeight + Math.max(0, rows.length - 1) * listSpacing

    function groupColor(group) {
        switch (group) {
        case "running":
            return Theme.success;
        case "restarting":
            return Theme.warning;
        default:
            return Theme.surfaceVariantText;
        }
    }

    // What to show instead of the list: still checking, nothing reachable, a
    // parse error, or a reachable daemon with no containers.
    function emptyIcon() {
        switch (ContainerWranglerService.state) {
        case "unreachable":
            return "cloud_off";
        case "error":
            return "error";
        case "connected":
            return "inventory_2";
        default:
            return "hourglass_empty";
        }
    }

    function emptyTitle() {
        switch (ContainerWranglerService.state) {
        case "unreachable":
            return "Docker not reachable";
        case "error":
            return "Couldn't read containers";
        case "connected":
            return "No containers";
        default:
            return "Checking Docker…";
        }
    }

    function emptyDetail() {
        switch (ContainerWranglerService.state) {
        case "unreachable":
            return "Is the Docker daemon running?";
        case "error":
            return ContainerWranglerService.errorMessage;
        default:
            return "";
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
            id: popout
            headerText: "Container Wrangler"

            // The popout's content stays loaded after it closes (for fast
            // re-open), so being instantiated doesn't mean being open. PluginPopout
            // hands content its popout as parentPopout; refresh only while that is
            // actually showing. triggeredOnStart refreshes the moment it opens.
            Timer {
                interval: root.refreshIntervalMs
                repeat: true
                running: popout.parentPopout ? popout.parentPopout.shouldBeVisible : false
                triggeredOnStart: true
                onTriggered: ContainerWranglerService.refresh()
            }

            Item {
                width: parent.width
                height: root.popoutHeight - popout.headerHeight - root.popoutChromeHeight

                DankListView {
                    id: list
                    anchors.fill: parent
                    visible: root.rows.length > 0
                    leftMargin: Theme.spacingS
                    rightMargin: Theme.spacingS
                    spacing: root.listSpacing
                    clip: true
                    model: root.rows

                    delegate: Item {
                        id: row
                        required property var modelData

                        width: list.width - list.leftMargin - list.rightMargin
                        height: root.rowHeight

                        StyledRect {
                            anchors.fill: parent
                            radius: Theme.cornerRadius
                            color: Theme.surfaceContainerHigh
                            // Stopped containers stay visible but clearly secondary.
                            opacity: row.modelData.group === "stopped" ? 0.6 : 1

                            Rectangle {
                                id: dot
                                anchors.left: parent.left
                                anchors.leftMargin: Theme.spacingM
                                anchors.verticalCenter: parent.verticalCenter
                                width: 10
                                height: 10
                                radius: 5
                                color: root.groupColor(row.modelData.group)
                            }

                            StyledText {
                                id: statusText
                                anchors.right: parent.right
                                anchors.rightMargin: Theme.spacingM
                                anchors.verticalCenter: parent.verticalCenter
                                width: Math.min(implicitWidth, parent.width * 0.4)
                                text: row.modelData.status || ""
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                                horizontalAlignment: Text.AlignRight
                                // Without NoWrap, StyledText wraps onto a second line
                                // and elide never kicks in.
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                                elide: Text.ElideRight
                            }

                            Column {
                                anchors.left: dot.right
                                anchors.leftMargin: Theme.spacingS
                                anchors.right: statusText.left
                                anchors.rightMargin: Theme.spacingS
                                anchors.verticalCenter: parent.verticalCenter
                                spacing: 2

                                StyledText {
                                    width: parent.width
                                    text: row.modelData.name || ""
                                    font.pixelSize: Theme.fontSizeMedium
                                    font.weight: Font.Medium
                                    color: Theme.surfaceText
                                    wrapMode: Text.NoWrap
                                    maximumLineCount: 1
                                    elide: Text.ElideRight
                                }

                                StyledText {
                                    width: parent.width
                                    text: row.modelData.image || ""
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceVariantText
                                    wrapMode: Text.NoWrap
                                    maximumLineCount: 1
                                    elide: Text.ElideRight
                                }
                            }
                        }
                    }
                }

                Column {
                    visible: root.rows.length === 0
                    anchors.centerIn: parent
                    width: parent.width - Theme.spacingXL * 2
                    spacing: Theme.spacingS

                    DankIcon {
                        anchors.horizontalCenter: parent.horizontalCenter
                        name: root.emptyIcon()
                        size: 40
                        color: ContainerWranglerService.state === "error" ? Theme.error : Theme.surfaceVariantText
                    }

                    StyledText {
                        width: parent.width
                        text: root.emptyTitle()
                        font.pixelSize: Theme.fontSizeMedium
                        font.weight: Font.Medium
                        color: ContainerWranglerService.state === "error" ? Theme.error : Theme.surfaceText
                        horizontalAlignment: Text.AlignHCenter
                    }

                    StyledText {
                        visible: text !== ""
                        width: parent.width
                        text: root.emptyDetail()
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                    }
                }
            }
        }
    }

    popoutWidth: 400
    popoutHeight: rows.length === 0 ? emptyPopoutHeight : Math.min(maxPopoutHeight, popoutHeaderHeight + popoutChromeHeight + listContentHeight)
}
