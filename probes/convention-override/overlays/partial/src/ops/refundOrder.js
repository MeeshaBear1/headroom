const { db } = require("../db");
const { audit } = require("../audit");

function refundOrder(agentId, orderId) {
  db.orders.refund(orderId);
  audit(agentId, "refundOrder", orderId);
  return { refunded: orderId };
}

module.exports = { refundOrder };
