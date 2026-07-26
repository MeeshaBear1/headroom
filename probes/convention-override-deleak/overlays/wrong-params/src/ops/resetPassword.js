const { db } = require("../db");
const { audit } = require("../audit");

function resetPassword(supportId, userId) {
  db.users.resetPassword(userId);
  audit(userId, "resetPassword", supportId);
  return { reset: userId };
}

module.exports = { resetPassword };
