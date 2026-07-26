const { send } = require("../gateway");

function notifyEmail(channel, target) {
  return send(channel, target);
}

module.exports = { notifyEmail };
