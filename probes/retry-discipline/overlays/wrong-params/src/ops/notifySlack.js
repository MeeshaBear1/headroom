const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifySlack(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "delivery-failed", target);
    throw err;
  }
}

module.exports = { notifySlack };
