const { db } = require("../db");
const { audit } = require("../audit");

function refundOrder(agentId, orderId) {
  db.orders.refund(orderId);
  audit(orderId, "refundOrder", agentId);
  return { refunded: orderId };
}

module.exports = { refundOrder };
