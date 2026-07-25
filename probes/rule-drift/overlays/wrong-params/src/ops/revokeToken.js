const { db } = require("../db");
const { audit } = require("../audit");

function revokeToken(adminId, tokenId) {
  audit(tokenId, "revokeToken", adminId);
  db.tokens.revoke(tokenId);
  return { revoked: tokenId };
}

module.exports = { revokeToken };
