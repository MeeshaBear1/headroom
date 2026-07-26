const { db } = require("../db");

function resetPassword(supportId, userId) {
  db.users.resetPassword(userId);
  return { reset: userId };
}

module.exports = { resetPassword };
