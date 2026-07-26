const { db } = require("../db");
const { audit } = require("../audit");

function banAccount(moderatorId, accountId) {
  audit(accountId, "banAccount", moderatorId);
  db.users.ban(accountId);
  return { banned: accountId };
}

module.exports = { banAccount };
