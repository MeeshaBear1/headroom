const { db } = require("../db");
const { audit } = require("../audit");

function banAccount(moderatorId, accountId) {
  db.users.ban(accountId);
  audit(moderatorId, "banAccount", accountId);
  return { banned: accountId };
}

module.exports = { banAccount };
