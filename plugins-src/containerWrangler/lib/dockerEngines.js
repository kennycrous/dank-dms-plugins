// Pure logic for deciding which container engines to query and how to
// summarise their states, called from ContainerWranglerService.qml. No
// Qt/QML APIs here so this can be unit tested under plain Node.js (see
// dockerEngines.test.js).
//
// Engines are independent: each gets its own socket, probe and state, so one
// being unreachable or slow never hides another.
const DEFAULT_SOCKET = "unix:///var/run/docker.sock";

// Today that's a single Docker engine: DOCKER_HOST if set (passed through
// as-is — tcp://, ssh:// etc. are handled by the docker CLI's own -H
// parsing), else the default daemon socket. It's still a list so other
// Docker-API-compatible runtimes can be added as further entries.
function resolveEngines({ dockerHost }) {
    const host = (dockerHost || "").trim();
    return [{ id: "docker", label: "Docker", socket: host !== "" ? host : DEFAULT_SOCKET }];
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
