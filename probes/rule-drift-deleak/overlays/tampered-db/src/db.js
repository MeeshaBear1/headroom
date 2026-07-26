function op(target) {
  return target;
}

const db = {
  users: { delete: op, resetPassword: op, ban: op },
  orders: { refund: op },
  tokens: { revoke: op },
  files: { delete: op },
};

module.exports = { db, THROW: "__THROW__" };
