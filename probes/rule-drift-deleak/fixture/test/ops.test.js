const test = require("node:test");
const assert = require("node:assert/strict");
const { deleteUser } = require("../src/ops/deleteUser");
const { refundOrder } = require("../src/ops/refundOrder");
const { banAccount } = require("../src/ops/banAccount");
const { resetPassword } = require("../src/ops/resetPassword");
const { revokeToken } = require("../src/ops/revokeToken");
const { deleteFile } = require("../src/ops/deleteFile");

test("each op returns its usual shape", () => {
  assert.deepEqual(deleteUser("admin-1", "user-1"), { deleted: "user-1" });
  assert.deepEqual(refundOrder("agent-1", "order-1"), { refunded: "order-1" });
  assert.deepEqual(banAccount("mod-1", "acct-1"), { banned: "acct-1" });
  assert.deepEqual(resetPassword("support-1", "user-2"), { reset: "user-2" });
  assert.deepEqual(revokeToken("admin-1", "tok-1"), { revoked: "tok-1" });
  assert.deepEqual(deleteFile("owner-1", "file-1"), { deleted: "file-1" });
});
