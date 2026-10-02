// Pure view-model logic for the popout list: turns the service's per-engine
// results into one flat, ordered list of rows for a single ListView. No
// Qt/QML APIs here so this can be unit tested under plain Node.js (see
// containerRows.test.js).

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

// Rows are `{ type: "header", key, label, count }` or
// `{ type: "container", key, name, image, status, group }`. Only connected
// engines contribute, so one being unreachable never shows up as noise next
// to a working one. Headers appear only when more than one engine is
// connected; with a single engine they'd just be noise. Within an engine,
// containers sort running → restarting → stopped, then by name.
function buildRows(engines) {
    const connected = engines.filter(e => e.state === "connected");
    const showHeaders = connected.length > 1;
    const rows = [];

    for (const engine of connected) {
        if (showHeaders) {
            rows.push({
                type: "header",
                key: `header:${engine.id}`,
                label: engine.label,
                count: engine.containers.length
            });
        }

        const sorted = engine.containers
            .map(c => ({ c, group: containerGroup(c.state) }))
            .sort((a, b) => (GROUP_ORDER[a.group] - GROUP_ORDER[b.group]) || (a.c.name < b.c.name ? -1 : a.c.name > b.c.name ? 1 : 0));

        for (const { c, group } of sorted) {
            rows.push({
                type: "container",
                key: `${engine.id}:${c.id}`,
                name: c.name,
                image: c.image,
                status: c.status,
                group
            });
        }
    }

    return rows;
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildRows, containerGroup };
}
