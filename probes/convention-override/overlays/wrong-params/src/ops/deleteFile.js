const { db } = require("../db");
const { audit } = require("../audit");

function deleteFile(ownerId, fileId) {
  db.files.delete(fileId);
  audit(fileId, "deleteFile", ownerId);
  return { deleted: fileId };
}

module.exports = { deleteFile };
