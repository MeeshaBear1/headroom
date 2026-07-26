const { db } = require("../db");

function deleteFile(ownerId, fileId) {
  db.files.delete(fileId);
  return { deleted: fileId };
}

module.exports = { deleteFile };
