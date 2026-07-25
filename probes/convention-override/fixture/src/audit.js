const log = [];

function audit(actor, action, target) {
  log.push({ actor, action, target });
}

function getLog() {
  return log.slice();
}

function resetLog() {
  log.length = 0;
}

module.exports = { audit, getLog, resetLog };
