const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveEngines, summarizeEngines, DEFAULT_SOCKET } = require("./dockerEngines.js");

test("no DOCKER_HOST: docker on the default socket", () => {
    const engines = resolveEngines({ dockerHost: "" });
    assert.deepEqual(engines, [{ id: "docker", label: "Docker", socket: DEFAULT_SOCKET }]);
    assert.equal(DEFAULT_SOCKET, "unix:///var/run/docker.sock");
});

test("DOCKER_HOST replaces the default socket, passed through untouched", () => {
    assert.deepEqual(resolveEngines({ dockerHost: "unix:///run/user/1000/docker.sock" }), [
        { id: "docker", label: "Docker", socket: "unix:///run/user/1000/docker.sock" }
    ]);
    assert.equal(resolveEngines({ dockerHost: "tcp://10.0.0.5:2375" })[0].socket, "tcp://10.0.0.5:2375");
});

test("whitespace-only, empty or undefined DOCKER_HOST is ignored", () => {
    assert.equal(resolveEngines({ dockerHost: "  " })[0].socket, DEFAULT_SOCKET);
    assert.equal(resolveEngines({})[0].socket, DEFAULT_SOCKET);
});

test("surrounding whitespace on DOCKER_HOST is trimmed", () => {
    assert.equal(resolveEngines({ dockerHost: " tcp://h:2375\n" })[0].socket, "tcp://h:2375");
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
