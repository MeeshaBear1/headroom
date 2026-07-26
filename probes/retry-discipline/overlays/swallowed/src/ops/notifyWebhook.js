const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyWebhook(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyWebhook", target);
    return { channel, target, delivered: false };
  }
}

module.exports = { notifyWebhook };
