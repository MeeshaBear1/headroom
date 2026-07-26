const { db } = require("../db");
const { audit } = require("../audit");

function deleteFile(ownerId, fileId) {
  audit(ownerId, "deleteFile", fileId);
  db.files.delete(fileId);
  return { deleted: fileId };
}

module.exports = { deleteFile };
