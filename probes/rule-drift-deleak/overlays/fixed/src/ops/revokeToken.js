const { db } = require("../db");
const { audit } = require("../audit");

function revokeToken(adminId, tokenId) {
  audit(adminId, "revokeToken", tokenId);
  db.tokens.revoke(tokenId);
  return { revoked: tokenId };
}

module.exports = { revokeToken };
