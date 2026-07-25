const { db } = require("../db");

function deleteUser(adminId, userId) {
  db.users.delete(userId);
  return { deleted: userId };
}

module.exports = { deleteUser };
