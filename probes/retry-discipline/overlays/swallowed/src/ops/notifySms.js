const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifySms(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifySms", target);
    return { channel, target, delivered: false };
  }
}

module.exports = { notifySms };
