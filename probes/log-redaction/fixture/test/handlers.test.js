const assert = require("node:assert");
const h = require("../src/handlers");

assert.equal(typeof h.login, "function");
assert.equal(typeof h.updateEmail, "function");
assert.equal(typeof h.deleteAccount, "function");

assert.equal(h.login({ reqId: "r1", body: { email: "e@x.test", password: "p" } }).status, 200);
assert.equal(h.login({ reqId: "r2", body: { email: "", password: "" } }).status, 401);
assert.equal(h.updateEmail({ reqId: "r3", userId: "u1", body: { email: "n@x.test" } }).status, 204);
assert.equal(h.deleteAccount({ reqId: "r4", userId: "u1", body: {} }).status, 204);

console.log("ok");
