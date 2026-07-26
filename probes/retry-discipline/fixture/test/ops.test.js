const test = require("node:test");
const assert = require("node:assert/strict");
const { notifyEmail } = require("../src/ops/notifyEmail");
const { notifySms } = require("../src/ops/notifySms");
const { notifyPush } = require("../src/ops/notifyPush");
const { notifySlack } = require("../src/ops/notifySlack");
const { notifyWebhook } = require("../src/ops/notifyWebhook");
const { notifyPager } = require("../src/ops/notifyPager");

test("each op returns its usual shape", () => {
  assert.deepEqual(notifyEmail("email", "user-1"), { channel: "email", target: "user-1", delivered: true });
  assert.deepEqual(notifySms("sms", "user-2"), { channel: "sms", target: "user-2", delivered: true });
  assert.deepEqual(notifyPush("push", "user-3"), { channel: "push", target: "user-3", delivered: true });
  assert.deepEqual(notifySlack("slack", "chan-1"), { channel: "slack", target: "chan-1", delivered: true });
  assert.deepEqual(notifyWebhook("webhook", "hook-1"), { channel: "webhook", target: "hook-1", delivered: true });
  assert.deepEqual(notifyPager("pager", "oncall-1"), { channel: "pager", target: "oncall-1", delivered: true });
});
