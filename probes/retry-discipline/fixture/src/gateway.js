const FAIL = "__FAIL__";

let calls = 0;

function send(channel, target) {
  calls++;
  if (target === FAIL) throw new Error("gateway unavailable");
  return { channel, target, delivered: true };
}

function getCalls() {
  return calls;
}

function resetCalls() {
  calls = 0;
}

module.exports = { send, getCalls, resetCalls, FAIL };
