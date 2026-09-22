// Pure parsing logic for `colima status --json`, called from
// ContainerWranglerService.qml via Proc.runCommand's (stdout, exitCode)
// callback. No Qt/QML APIs here so this can be unit tested under plain
// Node.js (see colimaStatus.test.js) — the QML side only ever calls
// parseColimaStatus with what it captured from the process.
//
// exitCode meanings, from Proc.runCommand (dank-qml-common's
// DankCommon/Common/Proc.qml):
//   0   - colima ran and printed status JSON to stdout
//   124 - Proc's own 10s timeout fired before the process ever reported
//         back. Quickshell's Process only emits `exited` on a normal
//         process exit; a missing binary triggers `onErrorOccurred`
//         instead, which never fires `exited` (see quickshell's
//         src/io/process.cpp). So a missing colima binary silently hangs
//         until Proc's timeout turns it into this synthetic code.
//   any other nonzero - colima ran, found the binary, but the VM isn't up
//         (colima's CLI logs `colima is not running` via logrus.Fatal
//         and exits 1)
function parseColimaStatus({ exitCode, stdout }) {
    if (exitCode === 0) {
        try {
            const info = JSON.parse(stdout);
            return {
                state: "running",
                runtime: info.runtime || "",
                dockerSocket: info.docker_socket || ""
            };
        } catch (e) {
            return { state: "error", message: "failed to parse colima status output" };
        }
    }

    if (exitCode === 124) {
        return { state: "not-installed" };
    }

    return { state: "not-running" };
}

// QML imports this file directly as a script (no `module` global there);
// Node's CommonJS loader needs the explicit export for require() to work.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseColimaStatus };
}
