const { send } = require("../gateway");

function notifySms(channel, target) {
  return send(channel, target);
}

module.exports = { notifySms };
