// Pure logic for picking which docker socket to query, called from
// ContainerWranglerService.qml. No Qt/QML APIs here so this can be unit
// tested under plain Node.js (see dockerSocket.test.js).
//
// Order: Colima's socket (only when `colima status` succeeded and reported
// one), then DOCKER_HOST, then the default daemon socket. A missing or
// stopped Colima is not an error here — it just means the next candidate.
// DOCKER_HOST is passed through as-is (tcp://, ssh:// etc. are handled by
// the docker CLI's own -H parsing).
const DEFAULT_SOCKET = "unix:///var/run/docker.sock";

function resolveDockerSocket({ colima, dockerHost }) {
    if (colima && colima.state === "running" && colima.dockerSocket) {
        return { socket: colima.dockerSocket, source: "colima" };
    }

    const host = (dockerHost || "").trim();
    if (host !== "") {
        return { socket: host, source: "env" };
    }

    return { socket: DEFAULT_SOCKET, source: "default" };
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { resolveDockerSocket, DEFAULT_SOCKET };
}
