const { db } = require("../db");
const { audit } = require("../audit");

function revokeToken(adminId, tokenId) {
  db.tokens.revoke(tokenId);
  audit(tokenId, "revokeToken", adminId);
  return { revoked: tokenId };
}

module.exports = { revokeToken };
