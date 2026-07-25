const { db } = require("../db");

function revokeToken(adminId, tokenId) {
  db.tokens.revoke(tokenId);
  return { revoked: tokenId };
}

module.exports = { revokeToken };
