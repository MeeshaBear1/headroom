const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyEmail(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyEmail", target);
    throw err;
  }
}

module.exports = { notifyEmail };
