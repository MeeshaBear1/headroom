const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyEmail(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyEmail", target);
    try {
      return send(channel, target);
    } catch (err2) {
      throw err;
    }
  }
}

module.exports = { notifyEmail };
