const { send } = require("../gateway");

function notifySlack(channel, target) {
  return send(channel, target);
}

module.exports = { notifySlack };
