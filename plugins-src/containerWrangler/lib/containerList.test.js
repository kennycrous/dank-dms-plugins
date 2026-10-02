const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseContainerList, buildPsCommand } = require("./containerList.js");

// `docker ps --format '{{json .}}'` prints one JSON object per line.
const NGINX = JSON.stringify({
    ID: "a1b2c3d4e5f6",
    Names: "web",
    Image: "nginx:1.27",
    State: "running",
    Status: "Up 3 hours"
});
const POSTGRES = JSON.stringify({
    ID: "f6e5d4c3b2a1",
    Names: "db",
    Image: "postgres:16",
    State: "running",
    Status: "Up 3 hours (healthy)"
});

test("populated: one container per line", () => {
    const result = parseContainerList({ exitCode: 0, stdout: `${NGINX}\n${POSTGRES}\n` });
    assert.equal(result.ok, true);
    assert.deepEqual(result.containers, [
        { id: "a1b2c3d4e5f6", name: "web", image: "nginx:1.27", state: "running", status: "Up 3 hours" },
        { id: "f6e5d4c3b2a1", name: "db", image: "postgres:16", state: "running", status: "Up 3 hours (healthy)" }
    ]);
});

test("empty: no containers running", () => {
    const result = parseContainerList({ exitCode: 0, stdout: "" });
    assert.equal(result.ok, true);
    assert.deepEqual(result.containers, []);
});

test("blank lines are ignored", () => {
    const result = parseContainerList({ exitCode: 0, stdout: `\n${NGINX}\n\n` });
    assert.equal(result.containers.length, 1);
});

test("error: docker exited nonzero (e.g. socket unreachable)", () => {
    const result = parseContainerList({ exitCode: 1, stdout: "" });
    assert.equal(result.ok, false);
    assert.ok(result.message);
});

test("error: a line isn't valid JSON", () => {
    const result = parseContainerList({ exitCode: 0, stdout: `${NGINX}\nnot json\n` });
    assert.equal(result.ok, false);
    assert.ok(result.message);
});

test("command: lists all containers (-a), not just running, against the given socket", () => {
    assert.deepEqual(buildPsCommand("unix:///var/run/docker.sock"), [
        "docker", "-H", "unix:///var/run/docker.sock", "ps", "-a", "--format", "{{json .}}"
    ]);
});
