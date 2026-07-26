const { db } = require("../db");

function banAccount(moderatorId, accountId) {
  db.users.ban(accountId);
  return { banned: accountId };
}

module.exports = { banAccount };
