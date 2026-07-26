const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyPager(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyPager", target);
    return { channel, target, delivered: false };
  }
}

module.exports = { notifyPager };
