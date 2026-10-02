// Command and pure parsing logic for listing containers, called from
// ContainerWranglerService.qml via Proc.runCommand's (stdout, exitCode)
// callback. No Qt/QML APIs here so this can be unit tested under plain
// Node.js (see containerList.test.js).

// -a so stopped, exited and restarting containers show up too; each entry's
// `state`/`status` says which is which.
function buildPsCommand(socket) {
    return ["docker", "-H", socket, "ps", "-a", "--format", "{{json .}}"];
}

// Parses `docker ps --format '{{json .}}'` output: one JSON object per line
// (not a JSON array), and nothing at all when there are no containers.
function parseContainerList({ exitCode, stdout }) {
    if (exitCode !== 0) {
        return { ok: false, message: "docker ps failed" };
    }

    const containers = [];
    for (const line of stdout.split("\n")) {
        if (line.trim() === "") {
            continue;
        }
        try {
            const c = JSON.parse(line);
            containers.push({
                id: c.ID || "",
                name: c.Names || "",
                image: c.Image || "",
                state: c.State || "",
                status: c.Status || ""
            });
        } catch (e) {
            return { ok: false, message: "failed to parse docker ps output" };
        }
    }
    return { ok: true, containers };
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseContainerList, buildPsCommand };
}
