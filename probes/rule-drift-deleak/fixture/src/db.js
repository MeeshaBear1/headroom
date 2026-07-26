const THROW = "__THROW__";

function op(target) {
  if (target === THROW) throw new Error("mutation failed");
  return target;
}

const db = {
  users: { delete: op, resetPassword: op, ban: op },
  orders: { refund: op },
  tokens: { revoke: op },
  files: { delete: op },
};

module.exports = { db, THROW };
