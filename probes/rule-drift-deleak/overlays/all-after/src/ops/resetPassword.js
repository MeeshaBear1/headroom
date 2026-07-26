const { db } = require("../db");
const { audit } = require("../audit");

function resetPassword(supportId, userId) {
  db.users.resetPassword(userId);
  audit(supportId, "resetPassword", userId);
  return { reset: userId };
}

module.exports = { resetPassword };
