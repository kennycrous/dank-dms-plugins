// Pure view-model logic for the popout list: turns the service's container
// list into an ordered list of rows for a ListView. No Qt/QML APIs here so
// this can be unit tested under plain Node.js (see containerRows.test.js).

// Collapses docker's many container states into the three the UI styles:
// running, restarting (needs attention) and stopped (created, exited, paused,
// dead, ...).
function containerGroup(state) {
    if (state === "running") {
        return "running";
    }
    if (state === "restarting") {
        return "restarting";
    }
    return "stopped";
}

const GROUP_ORDER = { running: 0, restarting: 1, stopped: 2 };

// Rows are `{ key, name, image, status, group }`, sorted running → restarting
// → stopped, then by name.
function buildRows(containers) {
    return containers
        .map(c => ({ c, group: containerGroup(c.state) }))
        .sort((a, b) => (GROUP_ORDER[a.group] - GROUP_ORDER[b.group]) || (a.c.name < b.c.name ? -1 : a.c.name > b.c.name ? 1 : 0))
        .map(({ c, group }) => ({
            key: c.id,
            name: c.name,
            image: c.image,
            status: c.status,
            group
        }));
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildRows, containerGroup };
}
