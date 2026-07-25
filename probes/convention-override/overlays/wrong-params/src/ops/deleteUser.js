const { db } = require("../db");
const { audit } = require("../audit");

function deleteUser(adminId, userId) {
  db.users.delete(userId);
  audit(userId, "deleteUser", adminId);
  return { deleted: userId };
}

module.exports = { deleteUser };
