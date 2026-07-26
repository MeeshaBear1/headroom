const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyWebhook(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyWebhook", target);
    try {
      return send(channel, target);
    } catch (err2) {
      throw err;
    }
  }
}

module.exports = { notifyWebhook };
