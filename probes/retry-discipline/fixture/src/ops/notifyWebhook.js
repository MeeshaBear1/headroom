const { send } = require("../gateway");

function notifyWebhook(channel, target) {
  return send(channel, target);
}

module.exports = { notifyWebhook };
