const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveEngines, summarizeEngines, DEFAULT_SOCKET } = require("./dockerEngines.js");

const COLIMA_SOCKET = "unix:///home/kenny/.colima/default/docker.sock";
const COLIMA_RUNNING = { state: "running", dockerSocket: COLIMA_SOCKET };

test("no colima, no DOCKER_HOST: just docker on the default socket", () => {
    const engines = resolveEngines({ colima: { state: "not-running" }, dockerHost: "" });
    assert.deepEqual(engines, [{ id: "docker", label: "Docker", socket: DEFAULT_SOCKET }]);
    assert.equal(DEFAULT_SOCKET, "unix:///var/run/docker.sock");
});

test("colima still pending (null): docker is available straight away", () => {
    const engines = resolveEngines({ colima: null, dockerHost: "" });
    assert.deepEqual(engines.map(e => e.id), ["docker"]);
});

test("colima running with a different socket: both engines, colima first", () => {
    const engines = resolveEngines({ colima: COLIMA_RUNNING, dockerHost: "" });
    assert.deepEqual(engines, [
        { id: "colima", label: "Colima", socket: COLIMA_SOCKET },
        { id: "docker", label: "Docker", socket: DEFAULT_SOCKET }
    ]);
});

test("DOCKER_HOST replaces the default socket for docker, passed through untouched", () => {
    const engines = resolveEngines({ colima: null, dockerHost: "tcp://10.0.0.5:2375" });
    assert.deepEqual(engines, [{ id: "docker", label: "Docker", socket: "tcp://10.0.0.5:2375" }]);
});

test("whitespace-only or undefined DOCKER_HOST is ignored", () => {
    assert.equal(resolveEngines({ colima: null, dockerHost: "  " })[0].socket, DEFAULT_SOCKET);
    assert.equal(resolveEngines({ colima: null })[0].socket, DEFAULT_SOCKET);
});

test("DOCKER_HOST pointing at colima's socket: shown once, as colima", () => {
    const engines = resolveEngines({ colima: COLIMA_RUNNING, dockerHost: COLIMA_SOCKET });
    assert.deepEqual(engines, [{ id: "colima", label: "Colima", socket: COLIMA_SOCKET }]);
});

test("colima stopped, missing, errored, or without a docker socket: not an engine", () => {
    for (const colima of [
        { state: "not-running" },
        { state: "not-installed" },
        { state: "error", message: "x" },
        { state: "running", runtime: "containerd", dockerSocket: "" }
    ]) {
        assert.deepEqual(resolveEngines({ colima, dockerHost: "" }).map(e => e.id), ["docker"]);
    }
});

const eng = (state, extra = {}) => ({ id: "x", state, ...extra });

test("summary: any connected engine wins, even if another is unreachable", () => {
    assert.equal(summarizeEngines([eng("unreachable"), eng("connected")]).state, "connected");
});

test("summary: still waiting on an engine and none connected yet: unknown", () => {
    assert.equal(summarizeEngines([eng("unknown"), eng("unreachable")]).state, "unknown");
});

test("summary: error beats unreachable when nothing connected, and carries its message", () => {
    const result = summarizeEngines([eng("unreachable"), eng("error", { errorMessage: "bad output" })]);
    assert.equal(result.state, "error");
    assert.equal(result.errorMessage, "bad output");
});

test("summary: everything unreachable", () => {
    assert.equal(summarizeEngines([eng("unreachable"), eng("unreachable")]).state, "unreachable");
});

test("summary: no engines yet is unknown", () => {
    assert.equal(summarizeEngines([]).state, "unknown");
});
