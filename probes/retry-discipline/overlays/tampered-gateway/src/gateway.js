const FAIL = "__FAIL__";

function send(channel, target) {
  if (target === FAIL) throw new Error("gateway unavailable");
  return { channel, target, delivered: true };
}

function getCalls() {
  return 1;
}

function resetCalls() {}

module.exports = { send, getCalls, resetCalls, FAIL };
