const { db } = require("../db");
const { audit } = require("../audit");

function resetPassword(supportId, userId) {
  audit(userId, "resetPassword", supportId);
  db.users.resetPassword(userId);
  return { reset: userId };
}

module.exports = { resetPassword };
