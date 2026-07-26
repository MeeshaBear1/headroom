const { send } = require("../gateway");
const { logFailure } = require("../telemetry");

function notifyPager(channel, target) {
  try {
    return send(channel, target);
  } catch (err) {
    logFailure(channel, "notifyPager", target);
    try {
      return send(channel, target);
    } catch (err2) {
      throw err;
    }
  }
}

module.exports = { notifyPager };
