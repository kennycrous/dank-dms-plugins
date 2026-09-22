const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseColimaStatus } = require("./colimaStatus.js");

const RUNNING_STDOUT = JSON.stringify({
    display_name: "colima",
    driver: "QEMU",
    arch: "aarch64",
    runtime: "docker",
    mount_type: "sshfs",
    ip_address: "192.168.5.2",
    docker_socket: "unix:///Users/kenny/.colima/default/docker.sock",
    containerd_socket: "unix:///Users/kenny/.colima/default/containerd.sock",
    kubernetes: false,
    cpu: 2,
    memory: 2147483648,
    disk: 60129542144
});

test("running: exit 0 with valid colima status JSON", () => {
    const result = parseColimaStatus({ exitCode: 0, stdout: RUNNING_STDOUT });
    assert.equal(result.state, "running");
    assert.equal(result.runtime, "docker");
    assert.equal(result.dockerSocket, "unix:///Users/kenny/.colima/default/docker.sock");
});

test("not-running: colima installed but the VM is down (exit 1, no stdout)", () => {
    const result = parseColimaStatus({ exitCode: 1, stdout: "" });
    assert.equal(result.state, "not-running");
});

test("not-installed: colima binary missing, surfaced as the Proc timeout code (124)", () => {
    const result = parseColimaStatus({ exitCode: 124, stdout: "" });
    assert.equal(result.state, "not-installed");
});

test("error: exit 0 but stdout isn't valid JSON", () => {
    const result = parseColimaStatus({ exitCode: 0, stdout: "not json" });
    assert.equal(result.state, "error");
    assert.ok(result.message);
});
