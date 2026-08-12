const db = require("./db");

// Request shape: { reqId, userId, body }.

function login(req) {
  const user = db.findUser(req.body.email);
  if (!user || !db.checkPassword(user.id, req.body.password)) return { status: 401 };
  return { status: 200, token: db.issueToken(user.id) };
}

function updateEmail(req) {
  db.setEmail(req.userId, req.body.email);
  return { status: 204 };
}

function deleteAccount(req) {
  db.deleteUser(req.userId);
  return { status: 204 };
}

module.exports = { login, updateEmail, deleteAccount };
