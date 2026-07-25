const { db } = require("../db");

function refundOrder(agentId, orderId) {
  db.orders.refund(orderId);
  return { refunded: orderId };
}

module.exports = { refundOrder };
