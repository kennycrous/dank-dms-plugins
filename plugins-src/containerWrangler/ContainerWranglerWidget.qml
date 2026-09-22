import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins

PluginComponent {
    id: root

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
}
