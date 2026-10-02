const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildRows, containerGroup } = require("./containerRows.js");

const c = (name, state, extra = {}) => ({
    id: `id-${name}`, name, image: `${name}:latest`, state, status: `status of ${name}`, ...extra
});
const engine = (id, containers, state = "connected") => ({ id, label: id.toUpperCase(), state, containers });

test("containerGroup: running, restarting, everything else is stopped", () => {
    assert.equal(containerGroup("running"), "running");
    assert.equal(containerGroup("restarting"), "restarting");
    for (const s of ["exited", "created", "paused", "dead", "removing", ""]) {
        assert.equal(containerGroup(s), "stopped", s);
    }
});

test("single engine: no section header, sorted running → restarting → stopped, then by name", () => {
    const rows = buildRows([engine("docker", [
        c("zeta", "exited"),
        c("beta", "running"),
        c("alpha", "restarting"),
        c("alpha2", "exited"),
        c("aardvark", "running")
    ])]);
    assert.deepEqual(rows.map(r => r.type), Array(5).fill("container"));
    assert.deepEqual(rows.map(r => r.name), ["aardvark", "beta", "alpha", "alpha2", "zeta"]);
    assert.deepEqual(rows.map(r => r.group), ["running", "running", "restarting", "stopped", "stopped"]);
});

test("container rows carry what the delegate renders, plus a unique key", () => {
    const [row] = buildRows([engine("docker", [c("web", "running")])]);
    assert.deepEqual(row, {
        type: "container",
        key: "docker:id-web",
        name: "web",
        image: "web:latest",
        status: "status of web",
        group: "running"
    });
});

test("multiple connected engines: a header per engine with its container count", () => {
    const rows = buildRows([
        engine("colima", [c("a", "running")]),
        engine("docker", [c("b", "running"), c("c", "exited")])
    ]);
    assert.deepEqual(rows.map(r => r.type), ["header", "container", "header", "container", "container"]);
    assert.deepEqual(rows[0], { type: "header", key: "header:colima", label: "COLIMA", count: 1 });
    assert.equal(rows[2].count, 2);
});

test("same container id on two engines still gets distinct keys", () => {
    const rows = buildRows([
        engine("colima", [c("a", "running", { id: "same" })]),
        engine("docker", [c("a", "running", { id: "same" })])
    ]);
    const keys = rows.map(r => r.key);
    assert.equal(new Set(keys).size, keys.length);
});

test("unreachable and unknown engines contribute nothing, and don't trigger headers", () => {
    const rows = buildRows([
        engine("colima", [], "unreachable"),
        engine("docker", [c("b", "running")]),
        engine("other", [], "unknown")
    ]);
    assert.deepEqual(rows.map(r => r.type), ["container"]);
});

test("connected engine with no containers: no rows (UI shows its own empty state)", () => {
    assert.deepEqual(buildRows([engine("docker", [])]), []);
});

test("an empty engine still gets a header when several are connected", () => {
    const rows = buildRows([engine("colima", []), engine("docker", [c("b", "running")])]);
    assert.deepEqual(rows.map(r => r.type), ["header", "header", "container"]);
});

test("does not mutate its input", () => {
    const containers = [c("b", "exited"), c("a", "running")];
    buildRows([engine("docker", containers)]);
    assert.deepEqual(containers.map(x => x.name), ["b", "a"]);
});

test("no engines: no rows", () => {
    assert.deepEqual(buildRows([]), []);
});
