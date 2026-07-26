const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifySlack(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifySlack", target);
    try {
      return send(channel, target);
    } catch (err2) {
      throw err;
    }
  }
}

module.exports = { notifySlack };
