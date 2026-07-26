const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifySms(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifySms", target);
    try {
      return send(channel, target);
    } catch (err2) {
      throw err;
    }
  }
}

module.exports = { notifySms };
