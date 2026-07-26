const { send } = require("../gateway");

function notifyPager(channel, target) {
  return send(channel, target);
}

module.exports = { notifyPager };
