const { db } = require("../db");
const { audit } = require("../audit");

function deleteFile(ownerId, fileId) {
  audit(fileId, "deleteFile", ownerId);
  db.files.delete(fileId);
  return { deleted: fileId };
}

module.exports = { deleteFile };
