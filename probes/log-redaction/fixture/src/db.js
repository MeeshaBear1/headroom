// In-memory stand-in for the request store. Deterministic on purpose.
function findUser(email) {
  return email ? { id: "u-" + email.length } : null;
}

function checkPassword(userId, password) {
  return Boolean(password);
}

function issueToken(userId) {
  return "t-" + userId;
}

function setEmail(userId, email) {}

function deleteUser(userId) {}

module.exports = { findUser, checkPassword, issueToken, setEmail, deleteUser };
