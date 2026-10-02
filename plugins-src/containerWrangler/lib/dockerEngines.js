// Pure logic for deciding which container engines to query and how to
// summarise their states, called from ContainerWranglerService.qml. No
// Qt/QML APIs here so this can be unit tested under plain Node.js (see
// dockerEngines.test.js).
//
// Engines are independent: each gets its own socket, probe and state, so one
// being missing, stopped or slow never hides another.
const DEFAULT_SOCKET = "unix:///var/run/docker.sock";

// `colima` is the parsed `colima status --json` result, or null while that
// probe is still in flight — docker doesn't depend on it, so callers can
// resolve once up front and again when colima reports. A stopped or missing
// colima (or one with no docker socket, e.g. containerd) simply isn't an
// engine. DOCKER_HOST is passed through as-is (tcp://, ssh:// etc. are
// handled by the docker CLI's own -H parsing). If docker's socket is the same
// as colima's it isn't listed twice; colima takes the entry.
function resolveEngines({ colima, dockerHost }) {
    const engines = [];

    if (colima && colima.state === "running" && colima.dockerSocket) {
        engines.push({ id: "colima", label: "Colima", socket: colima.dockerSocket });
    }

    const host = (dockerHost || "").trim();
    const dockerSocket = host !== "" ? host : DEFAULT_SOCKET;
    if (!engines.some(e => e.socket === dockerSocket)) {
        engines.push({ id: "docker", label: "Docker", socket: dockerSocket });
    }

    return engines;
}

// Overall state across engines, each with state
// "unknown" | "connected" | "unreachable" | "error": any connected engine
// wins; otherwise still-waiting beats error beats unreachable.
function summarizeEngines(engines) {
    if (engines.some(e => e.state === "connected")) {
        return { state: "connected", errorMessage: "" };
    }
    if (engines.length === 0 || engines.some(e => e.state === "unknown")) {
        return { state: "unknown", errorMessage: "" };
    }
    const failed = engines.find(e => e.state === "error");
    if (failed) {
        return { state: "error", errorMessage: failed.errorMessage || "" };
    }
    return { state: "unreachable", errorMessage: "" };
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { resolveEngines, summarizeEngines, DEFAULT_SOCKET };
}
