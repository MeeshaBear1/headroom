// Logs events but drops the correlation id the convention requires.
const db = require("./db");
const log = require("./log");

function login(req) {
  log.info("login", {});
  const user = db.findUser(req.body.email);
  if (!user || !db.checkPassword(user.id, req.body.password)) return { status: 401 };
  return { status: 200, token: db.issueToken(user.id) };
}

function updateEmail(req) {
  log.info("updateEmail", {});
  db.setEmail(req.userId, req.body.email);
  return { status: 204 };
}

function deleteAccount(req) {
  log.info("deleteAccount", {});
  db.deleteUser(req.userId);
  return { status: 204 };
}

module.exports = { login, updateEmail, deleteAccount };
