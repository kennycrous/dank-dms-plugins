const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildRows, containerGroup } = require("./containerRows.js");

const c = (name, state, extra = {}) => ({
    id: `id-${name}`, name, image: `${name}:latest`, state, status: `status of ${name}`, ...extra
});

test("containerGroup: running, restarting, everything else is stopped", () => {
    assert.equal(containerGroup("running"), "running");
    assert.equal(containerGroup("restarting"), "restarting");
    for (const s of ["exited", "created", "paused", "dead", "removing", ""]) {
        assert.equal(containerGroup(s), "stopped", s);
    }
});

test("sorted running → restarting → stopped, then by name", () => {
    const rows = buildRows([
        c("zeta", "exited"),
        c("beta", "running"),
        c("alpha", "restarting"),
        c("alpha2", "exited"),
        c("aardvark", "running")
    ]);
    assert.deepEqual(rows.map(r => r.name), ["aardvark", "beta", "alpha", "alpha2", "zeta"]);
    assert.deepEqual(rows.map(r => r.group), ["running", "running", "restarting", "stopped", "stopped"]);
});

test("rows carry what the delegate renders, keyed by container id", () => {
    const [row] = buildRows([c("web", "running")]);
    assert.deepEqual(row, {
        key: "id-web",
        name: "web",
        image: "web:latest",
        status: "status of web",
        group: "running"
    });
});

test("does not mutate its input", () => {
    const containers = [c("b", "exited"), c("a", "running")];
    buildRows(containers);
    assert.deepEqual(containers.map(x => x.name), ["b", "a"]);
});

test("no containers: no rows", () => {
    assert.deepEqual(buildRows([]), []);
});
