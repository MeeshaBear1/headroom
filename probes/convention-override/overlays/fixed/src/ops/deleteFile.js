const { db } = require("../db");
const { audit } = require("../audit");

function deleteFile(ownerId, fileId) {
  db.files.delete(fileId);
  audit(ownerId, "deleteFile", fileId);
  return { deleted: fileId };
}

module.exports = { deleteFile };
