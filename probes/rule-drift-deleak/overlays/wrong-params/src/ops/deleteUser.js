const { db } = require("../db");
const { audit } = require("../audit");

function deleteUser(adminId, userId) {
  audit(userId, "deleteUser", adminId);
  db.users.delete(userId);
  return { deleted: userId };
}

module.exports = { deleteUser };
