const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveDockerSocket, DEFAULT_SOCKET } = require("./dockerSocket.js");

const COLIMA_SOCKET = "unix:///home/kenny/.colima/default/docker.sock";

test("colima running with a docker socket: use it", () => {
    const result = resolveDockerSocket({
        colima: { state: "running", dockerSocket: COLIMA_SOCKET },
        dockerHost: "unix:///somewhere/else.sock"
    });
    assert.deepEqual(result, { socket: COLIMA_SOCKET, source: "colima" });
});

test("colima not running: fall back to DOCKER_HOST", () => {
    const result = resolveDockerSocket({
        colima: { state: "not-running" },
        dockerHost: "unix:///run/user/1000/docker.sock"
    });
    assert.deepEqual(result, { socket: "unix:///run/user/1000/docker.sock", source: "env" });
});

test("colima not installed, no DOCKER_HOST: default socket", () => {
    const result = resolveDockerSocket({ colima: { state: "not-installed" }, dockerHost: "" });
    assert.deepEqual(result, { socket: DEFAULT_SOCKET, source: "default" });
    assert.equal(DEFAULT_SOCKET, "unix:///var/run/docker.sock");
});

test("colima running but no docker socket (e.g. containerd runtime): fall through", () => {
    const result = resolveDockerSocket({
        colima: { state: "running", runtime: "containerd", dockerSocket: "" },
        dockerHost: ""
    });
    assert.equal(result.source, "default");
});

test("colima status error: fall through instead of failing", () => {
    const result = resolveDockerSocket({ colima: { state: "error", message: "x" }, dockerHost: "" });
    assert.equal(result.source, "default");
});

test("whitespace-only or undefined DOCKER_HOST is ignored", () => {
    assert.equal(resolveDockerSocket({ colima: { state: "not-running" }, dockerHost: "  " }).source, "default");
    assert.equal(resolveDockerSocket({ colima: { state: "not-running" } }).source, "default");
});

test("non-unix DOCKER_HOST is passed through untouched", () => {
    const result = resolveDockerSocket({ colima: { state: "not-running" }, dockerHost: "tcp://10.0.0.5:2375" });
    assert.deepEqual(result, { socket: "tcp://10.0.0.5:2375", source: "env" });
});
