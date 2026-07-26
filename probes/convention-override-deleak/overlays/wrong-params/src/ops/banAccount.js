const { db } = require("../db");
const { audit } = require("../audit");

function banAccount(moderatorId, accountId) {
  db.users.ban(accountId);
  audit(accountId, "banAccount", moderatorId);
  return { banned: accountId };
}

module.exports = { banAccount };
