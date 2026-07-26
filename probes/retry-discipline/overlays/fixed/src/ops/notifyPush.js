const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyPush(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyPush", target);
    throw err;
  }
}

module.exports = { notifyPush };
