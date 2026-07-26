const { send } = require("../gateway");

function notifyPush(channel, target) {
  return send(channel, target);
}

module.exports = { notifyPush };
