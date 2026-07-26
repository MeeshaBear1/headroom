const { db } = require("../db");
const { audit } = require("../audit");

function refundOrder(agentId, orderId) {
  audit(agentId, "refundOrder", orderId);
  db.orders.refund(orderId);
  return { refunded: orderId };
}

module.exports = { refundOrder };
